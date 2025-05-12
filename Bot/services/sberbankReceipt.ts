import { spawn } from "node:child_process";
import * as path from "node:path";

interface ReceiptData {
  name: string;
  amount: string;
  time: string;
}

export class SberbankReceipt {
  private readonly scriptDir: string;
  private readonly pythonPath: string;

  constructor() {
    this.scriptDir = path.join(process.cwd(), "..", "Script");
    // Try to find Python in common locations
    this.pythonPath = this.findPythonPath();
  }

  private findPythonPath(): string {
    // Common Python executable names
    const pythonNames = ["python", "python3", "py"];

    // Try to find Python in PATH
    for (const name of pythonNames) {
      try {
        const result = require("child_process").spawnSync(name, ["--version"]);
        if (result.status === 0) {
          return name;
        }
      } catch (error) {
        continue;
      }
    }

    // If Python is not found in PATH, try common installation paths
    const commonPaths = [
      "C:\\Python39\\python.exe",
      "C:\\Python310\\python.exe",
      "C:\\Python311\\python.exe",
      "C:\\Users\\Yevhenii Work\\AppData\\Local\\Programs\\Python\\Python39\\python.exe",
      "C:\\Users\\Yevhenii Work\\AppData\\Local\\Programs\\Python\\Python310\\python.exe",
      "C:\\Users\\Yevhenii Work\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
    ];

    for (const pythonPath of commonPaths) {
      if (require("fs").existsSync(pythonPath)) {
        return pythonPath;
      }
    }

    throw new Error(
      "Python not found. Please install Python and make sure it is in your PATH"
    );
  }

  async generateReceipt(data: ReceiptData): Promise<string> {
    return new Promise((resolve, reject) => {
      const dataDict = JSON.stringify(data);
      const pythonProcess = spawn(
        this.pythonPath,
        [path.join(this.scriptDir, "receipt.py"), dataDict],
        {
          cwd: this.scriptDir,
        }
      );

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          resolve(path.join(this.scriptDir, "check_with_name_shifted_v4.png"));
        } else {
          reject(new Error(`Python script exited with code ${code}`));
        }
      });

      pythonProcess.on("error", (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }
}
