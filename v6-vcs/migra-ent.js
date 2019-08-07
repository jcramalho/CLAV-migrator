const csv = require('csvtojson')
const fs = require('fs')
require("console-sync")

// As entidades vão ser carregadas num array para validações posteriores
var ents = []
// Processamento das Entidades ....................
var csvFilePath = "../dados/csvs/ent-utf8.csv"
// Ficheiro de saída
var fout = '../dados/ontologia/ent.ttl'

// Header
fs.writeFileSync(fout, '### Entidades\n')

// Variáveis auxiliares
var sigla = "", estado = ""

console.log('Entidades: Comecei a processar')

csv({delimiter:";"})
    .fromFile(csvFilePath)
    .on('json', (jsonObj, rowIndex)=> {
        sigla = jsonObj['Sigla'].replace(/\.|\,/gm,"_").replace(/ /gm,"_")
        estado = jsonObj['Estado'].substring(0, 1)
        if(ents.indexOf(sigla) === -1){
            ents.push(sigla)

            var currentStatements = "###  http://jcr.di.uminho.pt/m51-clav#ent_" + sigla + '\n'
            currentStatements += ":ent_" + sigla + " rdf:type owl:NamedIndividual ,\n"
            currentStatements += "\t\t:Entidade ;\n"
            if(estado == "A")
                currentStatements += "\t:entEstado " + "\"Ativa\";\n"
            else
                currentStatements += "\t:entEstado " + "\"Inativa\";\n"
            currentStatements += "\t:entSIOE " + "\"" + jsonObj['ID SIOE'] + "\";\n"
            currentStatements += "\t:entSigla " + "\"" + sigla + "\";\n"
            // Atenção ao último triplo, tem que terminar em .
            currentStatements += "\t:entDesignacao " + "\"" + jsonObj['Designação'] + "\";\n"
            currentStatements += "\t:entInternacional " + "\"" + jsonObj['Internacional'] + "\".\n"

            // Relações de inclusão em tipologias
            if(jsonObj['Tipologia de Entidade']){
                var procRefs = jsonObj['Tipologia de Entidade']
                var procRefsSplit = procRefs.replace(/(\r\n|\n|\r|\s)/gm,"").split("#")
            
                for(var p=0, len = procRefsSplit.length; p<len; p++){
                    if(procRefsSplit[p]){
                        currentStatements += ":ent_" + sigla + " :pertenceTipologiaEnt " + ":tip_" + 
                            procRefsSplit[p].replace(/\.|\,/gm,"_") + " .\n"
                    } 
                }
            } 
            fs.appendFileSync(fout, currentStatements)
        } 
        else
            console.error("ERRO: Duplicação de entidade [" + sigla + "]  " + ents.indexOf(sigla) + "/" + ents.length + "::" + sigla )
        
    })
    .on('error',(err)=>{
        console.log(err)
    })
    .on('end', ()=>{
        console.log('Entidades: terminei.');
    })
    .on('done', ()=>{
        fs.appendFileSync(fout, '\n### Entidades terminam aqui.\n\n')
        fs.writeFileSync("../dados/json/ent.json", JSON.stringify(ents, null, 2))
    })





