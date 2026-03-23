const vm = require('vm');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Executes code and evaluates against test cases
 * @param {string} language - 'JavaScript', 'Python', 'C++', 'Java'
 * @param {string} code - The user submitted code
 * @param {Array} testCases - Array of { input, expectedOutput }
 * @returns {Promise<Object>} - Results for each test case
 */
const runCode = async (language, code, testCases = []) => {
    const results = [];
    let totalElapsed = 0;

    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const start = Date.now();
        let actual = '';
        let status = 'FAILED';
        let error = null;

        try {
            if (language === 'JavaScript') {
                actual = executeJS(code, tc.input);
            } else if (language === 'Java') {
                actual = await executeJava(code, tc.input);
            } else if (language === 'C++') {
                actual = executeCppShim(code, tc.input);
            } else if (language === 'Python') {
                actual = await executePython(code, tc.input);
            } else {
                throw new Error(`${language} execution is not supported. Please use JavaScript, Java, Python, or C++.`);
            }

            // Normalize for comparison — strip whitespace around JSON-like structures
            const normalize = (s) => String(s).trim().replace(/\s*,\s*/g, ',').replace(/\[\s+/g, '[').replace(/\s+\]/g, ']');
            const normalizedActual = normalize(actual);
            const normalizedExpected = normalize(tc.expectedOutput);
            status = normalizedActual === normalizedExpected ? 'PASSED' : 'FAILED';

        } catch (err) {
            error = err.message;
            actual = `ERROR: ${err.message}`;
            status = 'ERROR';
        }

        const elapsed = Date.now() - start;
        totalElapsed += elapsed;

        results.push({
            id: i + 1,
            input: tc.input,
            expected: tc.expectedOutput,
            actual: actual !== undefined ? String(actual).trim() : 'undefined',
            status,
            error,
            executionTime: `${elapsed}ms`
        });
    }

    const passedCount = results.filter(r => r.status === 'PASSED').length;
    const failedCount = results.length - passedCount;

    return {
        results,
        passedCount,
        failedCount,
        totalTests: results.length,
        output: generateOutputSummary(passedCount, results.length, totalElapsed)
    };
};

// ==================== JAVASCRIPT EXECUTION ====================

const executeJS = (code, input) => {
    // Build a generic runner that captures output
    const wrappedCode = `
        const __captured = [];
        const __origLog = console.log;
        console.log = (...args) => __captured.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));

        // Global Array Polyfills for C++ compatibility
        Array.prototype.size = function() { return this.length; };
        Array.prototype.push_back = function(v) { this.push(v); };
        Array.prototype.pop_back = function() { return this.pop(); };
        Array.prototype.empty = function() { return this.length === 0; };
        Array.prototype.clear = function() { this.length = 0; };
        Array.prototype.front = function() { return this[0]; };
        Array.prototype.back = function() { return this[this.length - 1]; };

        // C++ Polyfills
        const CppVector = (sizeOrArr, fillVal) => {
            let arr = Array.isArray(sizeOrArr) ? sizeOrArr : (typeof sizeOrArr === 'number' ? new Array(sizeOrArr).fill(fillVal) : []);
            return arr; // Now standard arrays have the methods via prototype
        };

        const CppMap = () => {
            const target = {};
            return new Proxy(target, {
                get: (t, prop) => {
                    if (prop === 'find') return (k) => (k in t ? k : undefined);
                    if (prop === 'count') return (k) => (k in t ? 1 : 0);
                    if (prop === 'end') return () => undefined;
                    if (prop === 'size') return () => Object.keys(t).length;
                    if (prop === 'empty') return () => Object.keys(t).length === 0;
                    if (prop === 'erase') return (k) => { delete t[k]; };
                    if (prop === 'clear') return () => { for (let k in t) delete t[k]; };
                    return t[prop];
                }
            });
        };

        ${code}

        // Try to detect and call the user's function automatically
        let __result;
        const __inputRaw = \`${input.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`;

        // Parse input lines
        const __inputLines = __inputRaw.trim().split('\\n');

        // Try to parse values from input
        function __parseValue(s) {
            s = s.trim();
            try { return JSON.parse(s); } catch(e) { return s; }
        }

        const __parsedInputs = __inputLines.map(__parseValue);

        // Strategy 1: Look for a 'solve' function
        if (typeof solve === 'function') {
            __result = __parsedInputs.length === 1 ? solve(__parsedInputs[0]) : solve(...__parsedInputs);
        }
        // Strategy 2: Look for a class Solution with a method
        else if (typeof Solution === 'function') {
            const __sol = new Solution();
            const __methods = Object.getOwnPropertyNames(Solution.prototype).filter(m => m !== 'constructor');
            if (__methods.length > 0) {
                const __method = __sol[__methods[0]].bind(__sol);
                __result = __parsedInputs.length === 1 ? __method(__parsedInputs[0]) : __method(...__parsedInputs);
            }
        }
        // Strategy 3: Find any globally defined function that isn't built-in
        else {
            const __builtins = new Set(['__parseValue', '__captured', '__origLog', '__inputRaw', '__inputLines', '__parsedInputs', '__result', 'console', 'Math', 'JSON', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'undefined', 'NaN', 'Infinity', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'RegExp', 'Error', 'Map', 'Set', 'Promise', 'Symbol', 'Proxy', 'Reflect', 'eval', 'setTimeout', 'setInterval']);
            const __globals = Object.keys(this).filter(k => typeof this[k] === 'function' && !__builtins.has(k));
            if (__globals.length > 0) {
                const __fn = this[__globals[0]];
                __result = __parsedInputs.length === 1 ? __fn(__parsedInputs[0]) : __fn(...__parsedInputs);
            }
        }

        // Format and append result if returned
        if (__result !== undefined) {
            const __resStr = typeof __result === 'object' ? JSON.stringify(__result) : String(__result);
            if (__captured.length === 0) {
                __captured.push(__resStr);
            } else {
                // If we already have logs, the result is likely the last line of output
                // But only if it's not already the last line (to avoid duplicates)
                if (__captured[__captured.length - 1] !== __resStr) {
                    __captured.push(__resStr);
                }
            }
        }

        // Return captured output
        __captured.join('\\n');
    `;

    const context = { console: { log: () => {} }, Math, JSON, parseInt, parseFloat, isNaN, isFinite, Array, Object, String, Number, Boolean, Date, RegExp, Error, Map, Set };
    vm.createContext(context);
    const result = vm.runInContext(wrappedCode, context, { timeout: 5000 });
    return result !== undefined ? String(result) : '';
};

// ==================== JAVA EXECUTION (NATIVE) ====================

const executeJava = async (code, input) => {
    const tmpDir = path.join(os.tmpdir(), `java_exec_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    try {
        // Extract class name from code
        const classNameMatch = code.match(/class\s+(\w+)/);
        const className = classNameMatch ? classNameMatch[1] : 'Solution';

        // Check if code has a main method; if not, wrap it
        let finalCode = code;
        if (!code.includes('public static void main')) {
            // Build a wrapper with a main method that calls the user's solution
            finalCode = buildJavaWrapper(code, className, input);
        } else {
            // If they have main, inject input via stdin simulation
            finalCode = code;
        }

        const javaFile = path.join(tmpDir, `${className}.java`);
        fs.writeFileSync(javaFile, finalCode);

        // Compile
        try {
            execSync(`javac "${javaFile}"`, { cwd: tmpDir, timeout: 10000, stdio: 'pipe' });
        } catch (compileErr) {
            const stderr = compileErr.stderr ? compileErr.stderr.toString() : compileErr.message;
            throw new Error(`Compilation Error:\n${stderr}`);
        }

        // Execute
        try {
            const output = execSync(`java -cp "${tmpDir}" ${className}`, {
                cwd: tmpDir,
                timeout: 10000,
                encoding: 'utf8',
                input: input,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            return output.trim();
        } catch (runErr) {
            const stderr = runErr.stderr ? runErr.stderr.toString() : runErr.message;
            throw new Error(`Runtime Error:\n${stderr}`);
        }
    } finally {
        // Cleanup temp directory
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
    }
};

/**
 * Build a Java wrapper that injects main() directly into the user's class
 */
const buildJavaWrapper = (code, className, input) => {
    const importLines = [];
    const codeLines = [];
    for (const line of code.split('\n')) {
        if (line.trim().startsWith('import ')) {
            importLines.push(line);
        } else {
            codeLines.push(line);
        }
    }

    let coreCode = codeLines.join('\n');

    // Find the last closing brace of the class and inject main() before it
    const lastBraceIdx = coreCode.lastIndexOf('}');
    if (lastBraceIdx === -1) {
        throw new Error('Could not find closing brace of class');
    }

    const mainMethod = `

    public static void main(String[] args) {
        try {
            java.util.Scanner sc = new java.util.Scanner(System.in);
            StringBuilder sb = new StringBuilder();
            while (sc.hasNextLine()) sb.append(sc.nextLine()).append("\\n");
            String rawInput = sb.toString().trim();

            ${className} sol = new ${className}();
            java.lang.reflect.Method[] methods = ${className}.class.getDeclaredMethods();
            java.lang.reflect.Method targetMethod = null;
            
            // Priority 1: Method with name 'solve' (matches our default boilerplate)
            for (java.lang.reflect.Method m : methods) {
                if (m.getName().equals("solve") && java.lang.reflect.Modifier.isPublic(m.getModifiers())) {
                    targetMethod = m;
                    break;
                }
            }
            
            // Priority 2: Method with name matching the problem (e.g. 'twoSum' for Two Sum)
            if (targetMethod == null) {
                for (java.lang.reflect.Method m : methods) {
                    if (!m.getName().equals("main") && !m.getName().startsWith("__") && java.lang.reflect.Modifier.isPublic(m.getModifiers())) {
                        targetMethod = m;
                        break;
                    }
                }
            }
            if (targetMethod == null) {
                System.out.println("ERROR: No public method found");
                return;
            }

            Class<?>[] paramTypes = targetMethod.getParameterTypes();
            String[] inputLines = rawInput.split("\\n");
            Object[] parsedArgs = new Object[paramTypes.length];

            for (int i = 0; i < paramTypes.length && i < inputLines.length; i++) {
                parsedArgs[i] = __parseInput(inputLines[i].trim(), paramTypes[i]);
            }

            Object result = targetMethod.invoke(sol, parsedArgs);
            if (result != null) {
                if (result instanceof int[]) {
                    String s = java.util.Arrays.toString((int[])result);
                    System.out.println(s.replaceAll("\\s", ""));
                }
                else if (result instanceof String[]) {
                    String s = java.util.Arrays.toString((String[])result);
                    System.out.println(s.replaceAll("\\s", ""));
                }
                else if (result instanceof Boolean) System.out.println(String.valueOf(result).toLowerCase());
                else System.out.println(result);
            }
        } catch (Exception e) {
            System.out.println("ERROR: " + e.getMessage());
        }
    }

    private static Object __parseInput(String s, Class<?> type) {
        s = s.trim();
        if (type == int.class || type == Integer.class) return Integer.parseInt(s.replaceAll("[^0-9-]", ""));
        if (type == long.class || type == Long.class) return Long.parseLong(s.replaceAll("[^0-9-]", ""));
        if (type == double.class || type == Double.class) return Double.parseDouble(s);
        if (type == boolean.class || type == Boolean.class) return Boolean.parseBoolean(s);
        if (type == String.class) return s.replace("\\\"", "");
        if (type == char[].class) {
            String clean = s.replaceAll("[\\\\[\\\\]\\\", ]", "");
            return clean.toCharArray();
        }
        if (type == int[].class) {
            s = s.replaceAll("[\\\\[\\\\]]", "").trim();
            if (s.isEmpty()) return new int[0];
            String[] parts = s.split(",");
            int[] arr = new int[parts.length];
            for (int i = 0; i < parts.length; i++) arr[i] = Integer.parseInt(parts[i].trim());
            return arr;
        }
        if (type == String[].class) {
            s = s.replaceAll("[\\\\[\\\\]]", "").trim();
            if (s.isEmpty()) return new String[0];
            String[] parts = s.split(",");
            for (int i = 0; i < parts.length; i++) parts[i] = parts[i].trim().replace("\\\"", "");
            return parts;
        }
        return s;
    }
`;

    const injectedCode = coreCode.substring(0, lastBraceIdx) + mainMethod + coreCode.substring(lastBraceIdx);

    return `
import java.util.*;
import java.io.*;
import java.math.*;
import java.text.*;
import java.util.regex.*;
import java.util.stream.*;
import java.util.function.*;
${importLines.join('\n')}

${injectedCode}
`.trim();
};

// ==================== C++ TO JS TRANSPILATION SHIM ====================

const executeCppShim = (code, input) => {
    const transpiledCode = transpileCppToJs(code);
    return executeJS(transpiledCode, input);
};

const transpileCppToJs = (cppCode) => {
    let jsCode = cppCode;

    // 1. Remove comments
    jsCode = jsCode.replace(/\/\/.*$/gm, '');
    jsCode = jsCode.replace(/\/\*[\s\S]*?\*\//g, '');

    // 2. Remove preprocessor directives (#include, #define, etc.)
    jsCode = jsCode.replace(/^\s*#\w+.*$/gm, '');

    // 3. Remove 'using namespace std;'
    jsCode = jsCode.replace(/using\s+namespace\s+std\s*;/g, '');

    // 4. Remove std:: prefix
    jsCode = jsCode.replace(/\bstd::/g, '');

    // 5. Remove access modifiers (public:, private:, protected:)
    jsCode = jsCode.replace(/\b(public|private|protected)\s*:/g, '');

    // 6. Handle container declarations: convert "vector<int> v;" to "let v = CppVector();"
    jsCode = jsCode.replace(/\bvector\s*<[^>]*>\s*([a-zA-Z_]\w*)\s*\(([^)]+)\)\s*;/g, 'let $1 = CppVector($2);'); // vector<int> v(n, 0);
    jsCode = jsCode.replace(/\bvector\s*<[^>]*>\s*([a-zA-Z_]\w*)\s*;/g, 'let $1 = CppVector();'); // vector<int> v;
    jsCode = jsCode.replace(/\bvector\s*<[^>]*>\s*([a-zA-Z_]\w*)\s*=\s*\{([^\}]*)\}\s*;/g, 'let $1 = CppVector([$2]);'); // vector<int> v = {1, 2};
    
    jsCode = jsCode.replace(/\b(unordered_map|map|unordered_set|set)\s*<[^>]*>\s*([a-zA-Z_]\w*)\s*;/g, 'let $2 = CppMap();');
    
    // Generic replacement for nested types or other declarations
    jsCode = jsCode.replace(/\b(vector|pair|map|set|unordered_map|unordered_set|stack|queue|deque)\s*<[^>]*>/g, 'let');

    // 7. Handle method signatures: convert "returnType methodName(type1 param1, ...) {" to "methodName(param1, ...) {"
    jsCode = jsCode.replace(/\b([a-zA-Z_]\w*)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*\{/g, (match, retType, methodName, params) => {
        if (['if', 'for', 'while', 'switch', 'return', 'new', 'throw', 'catch', 'else'].includes(methodName)) return match;
        if (['class', 'struct', 'interface', 'enum', 'namespace'].includes(retType)) return match;

        const cleanParams = params.split(',').map(p => {
            const trimmed = p.trim();
            if (!trimmed) return '';
            const parts = trimmed.split(/\s+/);
            return parts[parts.length - 1].replace(/[&*]/g, '');
        }).filter(p => p).join(', ');

        return `${methodName}(${cleanParams}) {`;
    });

    // 8. Replace C++ types with 'let' for variable declarations
    jsCode = jsCode.replace(/\b(int|double|float|bool|char|long|long\s+long|unsigned|short|size_t|auto|string|void|char\*)\b(?!\s*\()/g, 'let');
    
    // 8c. Special Case: map initializer lists
    jsCode = jsCode.replace(/let\s+([a-zA-Z_]\w*)\s*=\s*\{\s*\{([^}]*)\}\s*(,\s*\{([^}]*)\}\s*)*\}/g, (match, name) => {
        return `let ${name} = CppMap(); // mapped from init list`;
    });
    
    // 9. Handle vector/string methods
    jsCode = jsCode.replace(/\.substr\(/g, '.substring(');
    jsCode = jsCode.replace(/\.at\(\s*([^)]+)\s*\)/g, '[$1]'); // fixed .at(i) -> [i]
    jsCode = jsCode.replace(/\[([^\]]+)\](?!\s*=)/g, '[$1]'); // keep as is

    // 8b. Remove C-style casts like (int), (double), (float), (bool)
    jsCode = jsCode.replace(/\(\s*let\s*\)/g, '');

    // 9. Map C++ standard library functions to JS equivalents
    // Math functions
    jsCode = jsCode.replace(/\b(max|min|abs|sqrt|pow|floor|ceil|round|log|log2|log10)\s*\(/g, (match, method) => {
        return `Math.${method}(`;
    });
    // Fix double Math.Math
    jsCode = jsCode.replace(/\bMath\.Math\./g, 'Math.');

    // Container methods
    jsCode = jsCode.replace(/\.size\(\)/g, '.size()'); // Keep for Proxy
    jsCode = jsCode.replace(/\.push_back\s*\(/g, '.push_back('); // Keep for Proxy
    jsCode = jsCode.replace(/\.pop_back\s*\(\)/g, '.pop_back()'); // Keep for Proxy
    jsCode = jsCode.replace(/\.front\s*\(\)/g, '.front()'); // Keep for Proxy
    jsCode = jsCode.replace(/\.empty\s*\(\)/g, '.empty()'); // Keep for Proxy
    jsCode = jsCode.replace(/\.substr\s*\(/g, '.substring(');

    // sort() — C++ sort(v.begin(), v.end()) -> v.sort((a,b) => a-b)
    jsCode = jsCode.replace(/\bsort\s*\(\s*([a-zA-Z_]\w*)\.[^,]*,\s*[a-zA-Z_]\w*\.[^)]*\)/g, '$1.sort((a, b) => a - b)');
    
    // reverse() -> reverse(v.begin(), v.end()) -> v.reverse()
    jsCode = jsCode.replace(/\breverse\s*\(\s*([a-zA-Z_]\w*)\.[^,]*,\s*[a-zA-Z_]\w*\.[^)]*\)/g, '$1.reverse()');

    // fill() -> fill(v.begin(), v.end(), val) -> v.fill(val)
    jsCode = jsCode.replace(/\bfill\s*\(\s*([a-zA-Z_]\w*)\.[^,]*,\s*[a-zA-Z_]\w*\.[^,]*,\s*([^)]+)\)/g, '$1.fill($2)');

    // count() -> count(v.begin(), v.end(), val) -> v.filter(x => x === val).length
    jsCode = jsCode.replace(/\bcount\s*\(\s*([a-zA-Z_]\w*)\.[^,]*,\s*[a-zA-Z_]\w*\.[^,]*,\s*([^)]+)\)/g, '$1.filter(__x => __x === $2).length');

    // I/O - complex cout with multiple inserts
    jsCode = jsCode.replace(/\bcout\s*<<\s*([\s\S]*?);/g, (match, expression) => {
        // Replace << with + and endl with "\n"
        let parts = expression.replace(/<<\s*endl\b/g, ' + "\\n"').replace(/<<\s*/g, ' + ');
        return `console.log(${parts});`;
    });
    jsCode = jsCode.replace(/\bendl\b/g, '"\\n"');

    // swap
    jsCode = jsCode.replace(/\bswap\s*\(\s*([^,]+),\s*([^)]+)\)/g, '[$1, $2] = [$2, $1]');

    // make_pair
    jsCode = jsCode.replace(/\bmake_pair\s*\(/g, '[');
    jsCode = jsCode.replace(/\)\s*;(\s*\/\/.*make_pair)?/g, (match) => {
        // Only replace if it looks like it was a make_pair context - too fragile, skip
        return match;
    });

    // 10. Handle C++ initializer lists -> JS arrays
    // return {i, j}; -> return [i, j];
    jsCode = jsCode.replace(/return\s*\{([^{}]*)\}/g, 'return [$1]');
    // let x = {1, 2, 3}; -> let x = [1, 2, 3];
    jsCode = jsCode.replace(/=\s*\{([^{}]*)\}/g, '= [$1]');

    // 11. Cleanup
    jsCode = jsCode.replace(/\blet\s+let\b/g, 'let');
    jsCode = jsCode.replace(/;\s*;/g, ';');
    // Remove standalone 'let' on a line (leftovers from type stripping)
    jsCode = jsCode.replace(/^\s*let\s*$/gm, '');

    return jsCode;
};

// ==================== PYTHON EXECUTION ====================

const executePython = async (code, input) => {
    const tmpDir = path.join(os.tmpdir(), `py_exec_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    const userFile = path.join(tmpDir, 'solution.py');
    const runnerFile = path.join(tmpDir, 'runner.py');

    try {
        fs.writeFileSync(userFile, code);

        // Detect if user wrote a class Solution, a standalone function, or just procedural code
        const hasClass = /class\s+\w+/.test(code);
        const hasSolveFunc = /def\s+solve\s*\(/.test(code);

        // Build a flexible runner
        const runnerCode = `
import sys, json, os, math, re, collections, heapq, bisect, functools, itertools, datetime
sys.path.insert(0, ${JSON.stringify(tmpDir)})

raw_input_data = ${JSON.stringify(input)}
input_lines = raw_input_data.strip().split('\\n')

def parse_value(s):
    s = s.strip()
    try:
        return json.loads(s)
    except:
        # Try as int/float
        try:
            return int(s)
        except:
            try:
                return float(s)
            except:
                return s

parsed_inputs = [parse_value(line) for line in input_lines]

try:
    from solution import *
    
    # Strategy 1: class Solution with methods
    if 'Solution' in dir():
        sol = Solution()
        methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
        if methods:
            method = getattr(sol, methods[0])
            if len(parsed_inputs) == 1:
                result = method(parsed_inputs[0])
            else:
                result = method(*parsed_inputs)
            if result is not None:
                if isinstance(result, bool):
                    print(str(result).lower())
                elif isinstance(result, (list, dict)):
                    print(json.dumps(result))
                else:
                    print(result)
    # Strategy 2: standalone 'solve' function
    elif 'solve' in dir():
        if len(parsed_inputs) == 1:
            result = solve(parsed_inputs[0])
        else:
            result = solve(*parsed_inputs)
        if result is not None:
            if isinstance(result, bool):
                print(str(result).lower())
            elif isinstance(result, (list, dict)):
                print(json.dumps(result))
            else:
                print(result)
    else:
        # Strategy 3: find the first callable that isn't a builtin
        import types
        user_funcs = [name for name in dir() if not name.startswith('_') and isinstance(eval(name), types.FunctionType) and name not in ('parse_value',)]
        if user_funcs:
            fn = eval(user_funcs[0])
            if len(parsed_inputs) == 1:
                result = fn(parsed_inputs[0])
            else:
                result = fn(*parsed_inputs)
            if result is not None:
                if isinstance(result, bool):
                    print(str(result).lower())
                elif isinstance(result, (list, dict)):
                    print(json.dumps(result))
                else:
                    print(result)
        else:
            print("ERROR: No callable function found in your code")
except Exception as e:
    print(f"ERROR: {str(e)}")
`;
        fs.writeFileSync(runnerFile, runnerCode);

        const output = execSync(`python "${runnerFile}"`, {
            encoding: 'utf8',
            timeout: 10000,
            cwd: tmpDir
        });
        return output.trim();
    } catch (err) {
        const errMsg = err.stdout || err.stderr || err.message;
        throw new Error(errMsg.toString().trim());
    } finally {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
    }
};

// ==================== HELPERS ====================

const generateOutputSummary = (passed, total, elapsed) => {
    if (passed === total && total > 0) {
        return `Execution Successful!\nTotal Tests: ${total}\nPassed: ${passed}\nFailed: 0\nAverage Time: ${Math.round(elapsed/total)}ms\n\nAll test cases passed. You are ready to submit!`;
    } else {
        return `Execution Completed with mismatches.\nTotal Tests: ${total}\nPassed: ${passed}\nFailed: ${total - passed}\n\nReview the "Test Explorer" for details.`;
    }
};

module.exports = { runCode };
