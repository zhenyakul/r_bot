import { spawn } from "node:child_process";
import * as path from "node:path";
import * as fs from "fs";

interface BillReceiptData {
  amount: string;
  time: string;
  amount_decimal: string;
  value_420: string;
  value_1234: string;
  value_9876: string;
  value_10000: string;
}

export class SberbankBillReceipt {
  private readonly scriptDir: string;
  private readonly pythonPath: string;

  constructor() {
    this.scriptDir = path.join(process.cwd(), "..", "script");
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

  async generateBillReceipt(data: BillReceiptData): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const dataDict = JSON.stringify(data);
      const pythonProcess = spawn(
        this.pythonPath,
        [path.join(this.scriptDir, "receipt_sber_bill.py"), dataDict],
        {
          cwd: this.scriptDir,
        }
      );

      let errorOutput = "";

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          const outputPath = path.join(this.scriptDir, "updated_receipt.png");
          if (fs.existsSync(outputPath)) {
            resolve([outputPath]);
          } else {
            reject(new Error("Receipt image was not generated"));
          }
        } else {
          reject(
            new Error(`Python script failed with code ${code}: ${errorOutput}`)
          );
        }
      });

      pythonProcess.on("error", (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }
}
