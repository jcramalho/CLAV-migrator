const csv = require('csvtojson')
const fs = require('fs')

var listaErros = []

if (process.argv.length < 3){
    console.log('Atenção: não especificou a classe a migrar')
}
else{
    // Carregamento das entidades para verificação
    var jfile = require("jsonfile")
    var entidades = "../dados/json/ent.json"
    var legislacao = "../dados/json/leg.json"
    var tipologias = "../dados/json/tip.json"

    var entCatalog = jfile.readFileSync(entidades)
    var legCatalog = jfile.readFileSync(legislacao)
    var tipCatalog = jfile.readFileSync(tipologias) 
    
    var classe = require("./mclasse.js")
    classe.migraClasse(entCatalog, legCatalog, tipCatalog, process.argv[2], listaErros)

    console.log('Terminei a migração de: ' + process.argv[2])
}

