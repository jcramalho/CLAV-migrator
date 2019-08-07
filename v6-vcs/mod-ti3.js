exports.migraTI = function()
{
    const csv = require('csvtojson')
    const fs = require('fs')
    const nanoid = require('nanoid')
    require("console-sync")

     // Processamento dos Termos de Índice ....................
        var csvFilePath = "../dados/csvs/ti-utf8.csv"
        // Ficheiro de saída
        var fout = '../dados/ontologia/ti.ttl'

        // Header
        fs.writeFileSync(fout, '### Termos de Índice\n')
            
        console.log('Termos de Índice: Comecei a processar')
        // Título da classe de terceiro nível / quarto nível;Código;Termo;
        csv({delimiter:";"})
            .fromFile(csvFilePath)
            .on('json', (jsonObj, rowIndex)=> {
                var ticod = ""
                var cod = "c" + jsonObj['Código']
                var t = jsonObj['Termo'].replace(/(\r\n|\n|\r)/gm," ")
                
                ticod = "ti_" + nanoid()

                var currentStatements = "###  http://jcr.di.uminho.pt/m51-clav#" + ticod + '\n'
                currentStatements += ":" + ticod + " rdf:type owl:NamedIndividual ,\n"
                currentStatements += "\t:TermoIndice ;\n"
                currentStatements += "\trdfs:label \"TI: " + t + "\";\n"
                currentStatements += "\t:estaAssocClasse :" + cod + ";\n"
                currentStatements += "\t:estado \"Ativo\";\n"
                // Atenção ao último triplo, tem que terminar em .
                currentStatements += "\t:termo " + "\"" + t + "\"" + ".\n"
    
                fs.appendFileSync(fout, currentStatements)
            })
            .on('done', (error)=> {
                fs.appendFileSync(fout, '\n### Termos de Índice terminam aqui.\n\n')
            })
}