const User = require('../models/User');
const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const keywordsConfig = require('../config/keywords.json');

const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a PDF file' });
        }

        const filePath = req.file.path;
        const dataBuffer = fs.readFileSync(filePath);

        // Parse PDF
        let pdfData;
        try {
            const parser = new PDFParse({ data: dataBuffer });
            pdfData = await parser.getText();
            await parser.destroy();
        } catch (pdfErr) {
            console.error('PDF Parse Error:', pdfErr);
            const logMsg = `${new Date().toISOString()} - PDF Parse Error: ${pdfErr.message}\n${pdfErr.stack}\n`;
            fs.appendFileSync(path.join(__dirname, '../server_logs.txt'), logMsg);
            return res.status(422).json({ message: 'Failed to parse PDF. Please ensure it is a valid PDF document.' });
        }

        const text = (pdfData.text || '').toLowerCase();
        if (!text.trim()) {
            return res.status(422).json({ message: 'No readable text found in PDF. Please ensure it is not scanned or image-only.' });
        }

        // Flatten keywords for matching
        const allKeywords = [
            ...keywordsConfig.technicalSkills,
            ...keywordsConfig.concepts,
            ...keywordsConfig.softSkills
        ];

        let foundKeywords = 0;
        const matched = [];

        allKeywords.forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
                foundKeywords++;
                matched.push(keyword);
            }
        });

        const atsScore = Math.min(100, Math.round((foundKeywords / (allKeywords.length * 0.4)) * 100)); // Target 40% keyword density for 100% score

        // Update User
        const user = await User.findById(req.user._id);
        if (user) {
            user.resumePath = `/uploads/resumes/${req.file.filename}`;
            user.atsScore = atsScore;
            await user.save();

            res.json({
                message: 'Resume uploaded and matched successfully',
                atsScore,
                resumePath: user.resumePath,
                matchedCount: foundKeywords
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ message: error.message || 'Internal server error during resume processing' });
    }
};

const getResumeData = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('resumePath atsScore');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    uploadResume,
    getResumeData
};
