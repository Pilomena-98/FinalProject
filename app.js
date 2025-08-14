import express from 'express';
import mysql2 from 'mysql2';
import XMLHttpRequest from 'xhr2';

const app = express();
const port = 5000;

app.use(express.json());

app.get('/', (req, res) => {
    res.redirect("https://api.databursatil.com/v2/historicos?token=5fe41911cae9b9ae482b565fd21c6d&inicio=2025-01-01&final=2025-06-07&emisora_serie=AAPL*");
});

function ObtenerPrecio() { 
    const data = null;
    
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    
    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            console.log(this.responseText);
        }
    });

    //xhr.open("GET", "https://api.databursatil.com/v2/intradia?token=5fe41911cae9b9ae482b565fd21c6d&emisora_serie=ALSEA*,GFNORTEO&bolsa=BMV&intervalo=1h&inicio=2025-05-09&final=2025-05-09");
    xhr.open("GET", "https://api.databursatil.com/v2/descargas?token=5fe41911cae9b9ae482b565fd21c6d&archivo=guber&fecha=2025-06-02");
    xhr.send(data);

}
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});