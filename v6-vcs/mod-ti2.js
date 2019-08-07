exports.migraTI = function()
{
    const csv = require('csvtojson')
    const fs = require('fs')
    require("console-sync")

     // Processamento dos Termos de Índice ....................
        var csvFilePath = "../dados/csvs/ti-utf8.csv"
        // Ficheiro de saída
        var fout = '../dados/ontologia/ti.ttl'
        // Contador de termos para as labels
        var count = 1

        // Header
        fs.writeFileSync(fout, '### Termos de Índice\n')
            
        console.log('Termos de Índice: Comecei a processar')
        // Título da classe de terceiro nível / quarto nível;Código;Termo;
        csv({delimiter:";"})
            .fromFile(csvFilePath)
            .on('json', (jsonObj, rowIndex)=> {
                var cod = "c" + jsonObj['Código']//.replace(/\./gm,"_")
                var currentStatements = "###  http://jcr.di.uminho.pt/m51-clav#ti_" + count + '\n'
                currentStatements += ":ti_" + count + " rdf:type owl:NamedIndividual ,\n"
                currentStatements += "\t:TermoIndice ;\n"
                currentStatements += "\trdfs:label \"TI: " + jsonObj['Termo'] + "\";\n"
                currentStatements += "\t:estaAssocClasse :" + cod + ";\n"
                // Atenção ao último triplo, tem que terminar em .
                currentStatements += "\t:termo " + "\"" + jsonObj['Termo'] + "\"" + ".\n"
    
                fs.appendFileSync(fout, currentStatements)
                count++
            })
            .on('done', (error)=> {
                fs.appendFileSync(fout, '\n### Termos de Índice terminam aqui.\n\n')
            })
}