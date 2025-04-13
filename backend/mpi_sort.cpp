#include <mpi.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <sstream>
#include <algorithm>

using namespace std;

struct Product {
    string name;
    int price;
    string brand;
    string category;
};

Product parseLine(const string& line) {
    stringstream ss(line);
    string name, priceStr, brand, category;
    getline(ss, name, ',');
    getline(ss, priceStr, ',');
    getline(ss, brand, ',');
    getline(ss, category, ',');

    return Product{name, stoi(priceStr), brand, category};
}

string serializeProduct(const Product& p) {
    return p.name + "," + to_string(p.price) + "," + p.brand + "," + p.category;
}

Product deserializeProduct(const string& line) {
    return parseLine(line);
}

bool compareByPrice(const Product& a, const Product& b) {
    return a.price < b.price;
}

void quickSort(vector<Product>& arr, int low, int high) {
    if (low < high) {
        Product pivot = arr[high];
        int i = low - 1;

        for (int j = low; j < high; ++j) {
            if (compareByPrice(arr[j], pivot)) {
                ++i;
                swap(arr[i], arr[j]);
            }
        }
        swap(arr[i + 1], arr[high]);
        int pi = i + 1;

        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

void mergeSortedChunks(vector<Product>& data, const vector<Product>& chunk) {
    vector<Product> result;
    result.reserve(data.size() + chunk.size());
    size_t i = 0, j = 0;

    while (i < data.size() && j < chunk.size()) {
        if (compareByPrice(data[i], chunk[j]))
            result.push_back(data[i++]);
        else
            result.push_back(chunk[j++]);
    }
    while (i < data.size()) result.push_back(data[i++]);
    while (j < chunk.size()) result.push_back(chunk[j++]);

    data = result;
}

int main(int argc, char** argv) {
    int rank, size;
    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    if (argc != 3) {
        if (rank == 0)
            cerr << "Usage: ./mpi_sort input.csv output.csv\n";
        MPI_Finalize();
        return 1;
    }

    double start_time = MPI_Wtime();

    string inputFile = argv[1];
    string outputFile = argv[2];

    vector<Product> data;
    if (rank == 0) {
        ifstream fin(inputFile);
        string line;
        while (getline(fin, line)) {
            if (!line.empty())
                data.push_back(parseLine(line));
        }
        fin.close();
    }

    int total_products = data.size();
    MPI_Bcast(&total_products, 1, MPI_INT, 0, MPI_COMM_WORLD);

    int base_chunk = total_products / size;
    int remainder = total_products % size;
    int local_chunk = base_chunk + (rank < remainder ? 1 : 0);

    vector<int> chunk_sizes(size);
    for (int i = 0; i < size; ++i)
        chunk_sizes[i] = base_chunk + (i < remainder ? 1 : 0);

    vector<int> offsets(size);
    offsets[0] = 0;
    for (int i = 1; i < size; ++i)
        offsets[i] = offsets[i - 1] + chunk_sizes[i - 1];

    vector<Product> local_data(local_chunk);

    if (rank == 0) {
        for (int i = 1; i < size; ++i) {
            for (int j = 0; j < chunk_sizes[i]; ++j) {
                string line = serializeProduct(data[offsets[i] + j]);
                int len = line.size();
                MPI_Send(&len, 1, MPI_INT, i, 0, MPI_COMM_WORLD);
                MPI_Send(line.c_str(), len, MPI_CHAR, i, 0, MPI_COMM_WORLD);
            }
        }
        for (int j = 0; j < chunk_sizes[0]; ++j)
            local_data[j] = data[j];
    } else {
        for (int j = 0; j < local_chunk; ++j) {
            int len;
            MPI_Recv(&len, 1, MPI_INT, 0, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
            vector<char> buffer(len);
            MPI_Recv(buffer.data(), len, MPI_CHAR, 0, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
            local_data[j] = deserializeProduct(string(buffer.begin(), buffer.end()));
        }
    }

    quickSort(local_data, 0, local_data.size() - 1);

    vector<Product> sorted_data;
    if (rank == 0)
        sorted_data = local_data;

    if (rank == 0) {
        for (int i = 1; i < size; ++i) {
            vector<Product> received_chunk(chunk_sizes[i]);
            for (int j = 0; j < chunk_sizes[i]; ++j) {
                int len;
                MPI_Recv(&len, 1, MPI_INT, i, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
                vector<char> buffer(len);
                MPI_Recv(buffer.data(), len, MPI_CHAR, i, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
                received_chunk[j] = deserializeProduct(string(buffer.begin(), buffer.end()));
            }
            mergeSortedChunks(sorted_data, received_chunk);
        }
    } else {
        for (auto& p : local_data) {
            string line = serializeProduct(p);
            int len = line.size();
            MPI_Send(&len, 1, MPI_INT, 0, 0, MPI_COMM_WORLD);
            MPI_Send(line.c_str(), len, MPI_CHAR, 0, 0, MPI_COMM_WORLD);
        }
    }

    if (rank == 0) {
        ofstream fout(outputFile);
        for (auto& p : sorted_data)
            fout << serializeProduct(p) << "\n";
        fout.close();

        double end_time = MPI_Wtime();
        cout << "Total sorting time: " << (end_time - start_time) * 1000 << " ms" << endl;
    }

    MPI_Finalize();
    return 0;
}
