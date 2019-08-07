const csv = require('csvtojson')
const fs = require('fs')
require("console-sync")

// As entidades vão ser carregadas num array para validações posteriores
var tips = []

// Carregamento das entidades para verificação de colisões entre entidades e tipologias
var jfile = require("jsonfile")
var file = "../dados/json/ent.json"

jfile.readFile(file, function(err, entCatalog) {
    if(err)
        console.log(err)
    else{
        var csvFilePath = "../dados/csvs/tip-utf8.csv"
        // Ficheiro de saída
        var fout = '../dados/ontologia/tip.ttl'

        // Header
        fs.writeFileSync(fout, '### Tipologias\n')

        // Variáveis auxiliares
        var sigla = ""

        console.log('Tipologias: Comecei a processar')

        csv({delimiter:";"})
            .fromFile(csvFilePath)
            .on('json', (jsonObj, rowIndex)=> {
                sigla = jsonObj['Sigla'].replace(/\.|\,/gm,"_").replace(/ /gm,"_")
                //if((entCatalog.indexOf(sigla) === -1)&&(tips.indexOf(sigla) === -1)){
                    tips.push(sigla)

                    var currentStatements = "###  http://jcr.di.uminho.pt/m51-clav#tip_" + sigla + '\n'
                    currentStatements += ":tip_" + sigla + " rdf:type owl:NamedIndividual ,\n"
                    currentStatements += "\t\t:TipologiaEntidade ;\n"
                    currentStatements += "\t:tipEstado " + "\"Ativa\";\n"
                    currentStatements += "\t:tipSigla " + "\"" + sigla + "\";\n"
                    // Atenção ao último triplo, tem que terminar em .
                    currentStatements += "\t:tipDesignacao " + "\"" + jsonObj['Designação'] + "\".\n"
           
                    fs.appendFileSync(fout, currentStatements)
                //} 
                //else
                   // console.error("ERRO: Duplicação de tipologia [" + sigla + "]  " + tips.indexOf(sigla) + "/" + tips.length + "::" + sigla )
        
            })
            .on('error',(err)=>{
                console.log(err)
            })
            .on('end', ()=>{
                console.log('Tipologias: terminei.');
            })
            .on('done', ()=>{
                fs.appendFileSync(fout, '\n### Tipologias terminam aqui.\n\n')
                fs.writeFileSync("../dados/json/tip.json", JSON.stringify(tips, null, 2))
            })
    }
})
    
