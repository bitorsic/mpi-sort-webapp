import { useState } from "react"
import Navbar from "./components/Navbar"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { columns, DataTable, Product } from "./components/data-table"
import { OnChangeFn } from "@tanstack/react-table"

function App() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [threads, setThreads] = useState<number>(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [lineCount, setLineCount] = useState<number>(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const fetchProducts = async (page: number, size: number) => {
    try {
      const res = await fetch(
        `http://localhost:3000?page=${page.toString()}&size=${size.toString()}`
      );
      
      const json = await res.json();
      if (!res.ok) return alert(json.error);

      setProducts(json.data);
    } catch (err) {
      console.log(err);
      alert("Could not connect to the backend");
    }
  };

  const paginationChangeHandler: OnChangeFn<typeof pagination> = (updater) => {
    setPagination((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      fetchProducts(next.pageIndex, next.pageSize);
      return next;
    });
  }

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return alert("No file attached");

    try {
      const formData = new FormData();
      formData.append("csvFile", csvFile as Blob);
      formData.append("threads", threads.toString());

      const res = await fetch("http://localhost:3000", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) return alert(json.error);

      setLineCount(json.lineCount);
      alert(`Time taken for sorting using ${threads} thread${threads > 1 ? "s" : ""}: ${json.time} ms`);

      await fetchProducts(0, 10);
    } catch (err) {
      console.log(err);
      alert("Could not connect to the backend");
    }
  };

  return (
    <>
      <Navbar />
      <form className="grid w-full items-center gap-1.5 p-4" onSubmit={submitHandler}>
        <Label htmlFor="csvFile">Upload CSV File</Label>
        <Input type="file" accept=".csv" id="csvFile" 
          onChange={(e) => { 
            const target = e.target as HTMLInputElement;
            setCsvFile(target.files?.[0] || null);
          }}
        />

        <Label htmlFor="threads">Threads</Label>
        <Input type="number" id="threads" value={threads}
          onChange={(e) => {
            const target = e.target as HTMLInputElement;
            setThreads(Number(target.value));
          }}
        />

        <Button type="submit">Upload</Button>
      </form>

      {products.length > 0 && (
        <div className="container mx-auto py-10 px-4">
          <DataTable
            columns={columns}
            data={products}
            rowCount={lineCount}
            pagination={pagination}
            setPagination={paginationChangeHandler}
          />
        </div>
      )}
    </>
  )
}

export default App
