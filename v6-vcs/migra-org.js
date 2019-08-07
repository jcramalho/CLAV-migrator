const csv = require('csvtojson')
const fs = require('fs')
require("console-sync")

// As organizações vão ser carregadas num array para validações posteriores
var orgs = []
// Processamento das Organizações ....................
var csvFilePath = "../dados/org-utf8.csv"
// Ficheiro de saída
var fout = '../dados/ontologia/org.ttl'

// Header
fs.writeFileSync(fout, '### Organizações\n')

// Variáveis auxiliares
var sigla = ""

console.log('Organizações: Comecei a processar')

csv({delimiter:";"})
    .fromFile(csvFilePath)
    .on('json', (jsonObj, rowIndex)=> {
        sigla = jsonObj['Sigla'].replace(/\.|\,/gm,"_").replace(/ /gm,"_")
        orgs.push(sigla)

        var currentStatements = "###  http://jcr.di.uminho.pt/m51-clav#org_" + sigla + '\n'
        currentStatements += ":org_" + sigla + " rdf:type owl:NamedIndividual ,\n"
        currentStatements += "\t:Organizacao ;\n"
        currentStatements += "\t:orgSigla " + "\"" + sigla + "\";\n"
        // Atenção ao último triplo, tem que terminar em .
        currentStatements += "\t:orgNome " + "\"" + jsonObj['Designação'] + "\".\n"

        fs.appendFileSync(fout, currentStatements)
    })
    .on('error',(err)=>{
        console.log(err)
    })
    .on('end', ()=>{
        console.log('Organizações: terminei.');
    })
    .on('done', ()=>{
        fs.appendFileSync(fout, '\n### Organizações terminam aqui.\n\n')
        fs.writeFileSync("../dados/org.json", JSON.stringify(orgs, null, 2))
    })





