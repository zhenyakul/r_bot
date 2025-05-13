import { spawn } from "node:child_process";
import * as path from "node:path";
import * as fs from "fs";

interface ReceiptData {
  name: string;
  amount: string;
  time: string;
}

export class SberbankReceipt {
  private readonly scriptDir: string;
  private readonly pythonPath: string;

  constructor() {
    // Get the absolute path to the script directory
    this.scriptDir = path.resolve(process.cwd(), "..", "script");
    console.log("Script directory:", this.scriptDir);
    this.pythonPath = this.findPythonPath();
    console.log("Python path:", this.pythonPath);
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

  async generateReceipt(data: ReceiptData): Promise<string[]> {
    return new Promise((resolve, reject) => {
      // Prepare the data for the Python script
      const scriptData = {
        name: data.name,
        amount: data.amount,
        time: data.time,
      };

      // Convert data to JSON string
      const jsonData = JSON.stringify(scriptData);
      console.log("Sending data to Python:", jsonData);

      const scriptPath = path.join(this.scriptDir, "receipt.py");
      console.log("Python script path:", scriptPath);

      // Spawn Python process with the correct working directory
      const pythonProcess = spawn(this.pythonPath, [scriptPath, jsonData], {
        cwd: this.scriptDir,
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8",
          PYTHONUNBUFFERED: "1", // Force Python to flush output
        },
      });

      let errorOutput = "";
      let scriptOutput = "";

      pythonProcess.stderr.on("data", (data) => {
        const output = data.toString();
        errorOutput += output;
        console.error("Python stderr:", output);
      });

      pythonProcess.stdout.on("data", (data) => {
        const output = data.toString();
        scriptOutput += output;
        console.log("Python stdout:", output);
      });

      pythonProcess.on("close", (code) => {
        console.log("Python process exited with code:", code);
        console.log("Script output:", scriptOutput);
        console.log("Error output:", errorOutput);

        if (code === 0) {
          const lightPath = path.join(this.scriptDir, "check_light.png");
          const darkPath = path.join(this.scriptDir, "check_dark.png");
          console.log("Checking for output files at:", lightPath, darkPath);

          if (fs.existsSync(lightPath) && fs.existsSync(darkPath)) {
            console.log("Output files exist");
            resolve([lightPath, darkPath]);
          } else {
            const error = new Error(
              `Receipt images were not generated. Python output: ${scriptOutput}`
            );
            console.error(error);
            reject(error);
          }
        } else {
          const error = new Error(
            `Python script failed with code ${code}: ${errorOutput}`
          );
          console.error(error);
          reject(error);
        }
      });

      pythonProcess.on("error", (error) => {
        console.error("Failed to start Python process:", error);
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }
}
