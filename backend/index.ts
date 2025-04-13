import express from 'express';
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import multer from 'multer';
import readline from 'readline';

const app = express();
const port = 3000;

app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname);
  },
  filename: (req, file, cb) => {
    cb(null, `tmp/${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// endpoint to upload the CSV and trigger the sorting
app.post('/', upload.single("csvFile"), (req, res) => {
  const file = req.file as Express.Multer.File;
  if (!file) {
    res.status(400).json({ error: "No upload file found"})
    return;
  }

  const uploadPath = file.path;

  // run the MPI sort
  exec(`mpirun -np ${req.body.threads || 1} ./mpi_sort ${uploadPath} output.csv`, (error, stdout, stderr) => {
    if (error) {
      console.error(error.message);    
      res.status(500).json({ error: stderr});
      return;
    }

    const [time, lineCount] = stdout.split(", ");
    res.status(200).json({ time: Number(time), lineCount: Number(lineCount) });
  });
});

app.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const size = Number(req.query.size) || 10;

    const startLine = (page - 1) * size;
    const endLine = startLine + size;

    const stream = fs.createReadStream("output.csv");
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    const lines: string[] = [];
    let currentLine = 0;

    // fetching the lines from the csv
    for await (const line of rl) {
      if (currentLine >= startLine && currentLine < endLine) lines.push(line);
      if (currentLine >= endLine) break;
      currentLine++;
    }

    rl.close();

    // formatting the lines fetched into the proper json format
    const jsonLines: object[] = [];

    for (const line of lines) {
      const itemArr = line.split(",");
      jsonLines.push({
        name: itemArr[0],
        price: itemArr[1],
        brand: itemArr[2],
        category: itemArr[3],
      });
    }

    res.status(200).send({ message: "Fetched Successfully", data: jsonLines });
  } catch (err) { 
    res.status(500).json({ error: err.message });
  }
  
});

app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});
