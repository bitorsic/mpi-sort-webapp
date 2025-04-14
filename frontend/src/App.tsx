import { useState } from "react"
import Navbar from "./components/Navbar"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { columns, DataTable, Product } from "./components/data-table"

function App() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [threads, setThreads] = useState<number>(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [lineCount, setLineCount] = useState<number>(0);
  
  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return alert("No file attached");

    try {
      const formData = new FormData();
      formData.append("csvFile", csvFile as Blob);
      formData.append("threads", threads.toString());

      let res = await fetch("http://localhost:3000", {
        method: "POST",
        body: formData,
      });

      let json = await res.json();
      if (!res.ok) return alert(json.error);

      setLineCount(json.lineCount);
      alert(`Time taken for sorting using ${threads} threads: ${json.time} ms`);

      res = await fetch("http://localhost:3000");

      json = await res.json();
      if (!res.ok) return alert(json.error);

      setProducts(json.data);
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
          <DataTable columns={columns} data={products} />
        </div>
      )}
    </>
  )
}

export default App
