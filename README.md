# MPI Product Sorting WebApp

This is a full-stack web application for parallel sorting of product data using MPI. It accepts a CSV file with product information, uses a C++ MPI backend to sort based on prices, and displays the result in a paginated UI.

---

## 🧠 Tech Stack

- **Frontend**: Vite + React + TypeScript + ShadCN + TanStack Table
- **Backend**: Node.js + Express + TypeScript + Multer + child\_process
- **Sorting Engine**: C++ with MPI

---

## 📁 Project Structure

```
mpi-sort-webapp/
├── backend/
│   ├── index.ts             # Express server
│   ├── mpi_sort             # C++ compiled binary
│   ├── mpi_sort.cpp         # Source code for parallel sorting
│   ├── tmp/                 # Stores uploaded and sorted CSV files (create this manually)
├── frontend/                # Vite React frontend
```

---

## 🚀 Setup

### 1. Backend Setup

- Install dependencies:
  ```bash
  cd backend
  npm install
  ```
- Build MPI program:
  ```bash
  mpic++ -o mpi_sort mpi_sort.cpp
  ```
- Create the `tmp` folder to store CSVs:
  ```bash
  mkdir tmp
  ```
- Start the backend:
  ```bash
  npx tsx index.ts
  ```

### 2. Frontend Setup

- Start the frontend:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```

---

## 📦 API Endpoints

### POST `/`

Used to upload a CSV and run the MPI sort.

**Form Data:**

- `csvFile`: The CSV file to sort
- `threads`: Number of MPI threads to use

**Returns:**

```json
{
  "message": "File sorted successfully",
  "downloadUrl": "/tmp/sorted-<timestamp>.csv"
}
```

---

### GET `/`

Returns paginated product data from the sorted CSV.

**Query Params:**

- `page` (number): Page index (0-based)
- `size` (number): Page size

**Returns:**

```json
{
  "data": [ { name, price, brand, category }, ... ],
  "total": 5374
}
```

---

## 📄 CSV Format

No headers. 4 values per line:

```
name,price,brand,category
```

Example:

```
LogiTech Mouse,29.99,LogiTech,Accessories
Acer Aspire 5,549.99,Acer,Laptops
```

