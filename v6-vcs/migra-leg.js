const csv = require('csvtojson')
const fs = require('fs')
require("console-sync")

// Os documentos legislativos vão ser carregados num array para validações posteriores
var legCatalog = []

// Processamento da Legislação ....................
var csvFilePath = "../dados/csvs/leg-utf8.csv"
// Ficheiro de saída
var fout = '../dados/ontologia/leg.ttl'
// Contador para as labels
var count = 1

// Header
fs.writeFileSync(fout, '### Legislação\n')

console.log('Legislação: Comecei a processar');
// Tipo;Entidade;Número;Data;Sumário;Link;        
csv({delimiter:";"})
    .fromFile(csvFilePath)
    .on('json', (jsonObj, rowIndex)=> {
        var lcode = jsonObj['Tipo'].trim()
        if(jsonObj['Entidade']) lcode += " " + jsonObj['Entidade'].replace(/(\r\n|\n|\r| )/gm,"")
        if(jsonObj['Número']) lcode += " " + jsonObj['Número']
        var mycode = "leg_" + count
        count++
        if(legCatalog.indexOf(lcode) === -1){
            legCatalog.push(lcode)
            var mytit = jsonObj['Sumário'].replace(/\"/gm,"\\\"").replace(/(\r\n|\n|\r)/gm,"")
            
            var currentStatements = "###  http://jcr.di.uminho.pt/m51-clav#" + mycode + '\n'
            currentStatements += ":" + mycode + " rdf:type owl:NamedIndividual ,\n"
            currentStatements += "\t:Legislacao ;\n"
            currentStatements += "\t:rdfs:label \"Leg.: " + lcode + "\";\n"
            currentStatements += "\t:diplomaTipo " + "\"" + jsonObj['Tipo'] + "\";\n"

            if(jsonObj['Entidade']){
                var entidades = jsonObj['Entidade'].replace(/(\r\n|\n|\r| )/gm,"").split(";")
                if(entidades.length > 1) console.log('\nVárias entidades: '+jsonObj['Entidade']+" :: "+lcode)
                for(var i in entidades){
                    currentStatements += "\t:diplomaEntidade " + ":org_" + entidades[i] + ";\n"
                }
            }
            
            currentStatements += "\t:diplomaNumero " + "\"" + jsonObj['Número'] + "\";\n"
            currentStatements += "\t:diplomaData " + "\"" + jsonObj['Data'] + "\";\n"
            currentStatements += "\t:diplomaSumario " + "\"" + mytit + "\";\n"

            // Atenção ao último triplo, tem que terminar em .
            currentStatements += "\t:diplomaLink " + "\"" + jsonObj['Link'] + "\".\n"

            fs.appendFileSync(fout, currentStatements)
        }                   
        else
            console.error("ERRO: Duplicação de id na legislação [" + mycode + "]  " + legCatalog.indexOf(lcode) + "/" + legCatalog.length + "::" + lcode )
    })
    .on('error',(err)=>{
        console.log(err)
    })
    .on('end', ()=>{
        console.log('Legislação: terminei.');
    })
    .on('done', (error)=> {
        fs.appendFileSync(fout, '\n### Legislação termina aqui.\n\n')
        fs.writeFileSync("../dados/json/leg.json", JSON.stringify(legCatalog, null, 2))
    })