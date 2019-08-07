// Módulo que contem as funções de suporte à migração
//      2017-08-13: criado
//          by jcr

const fs = require('fs')
const nanoid = require('nanoid')

exports.calcClasse = function(cod)
{
    var classe = 0
    if (cod.search(/\d{3}\.\d{1,3}\.\d{1,3}\.\d{1,4}/)!= -1) {
        classe = 4
    } else 
        if(cod.search(/\d{3}\.\d{1,3}\.\d{1,3}/)!= -1) 
            classe=3
        else
            if (cod.search(/\d{3}\.\d{1,3}/)!= -1) 
                classe=2
            else 
                if (cod.search(/\d{3}/)!= -1) {
                    classe=1
                } else {
                    classe=0
                }
    return classe
}

// Notas de aplicação
exports.migraNA = function(classCode, jsonObj, fout)
{
    var naList = []
    // tratamento das notas de aplicação
        if (jsonObj['Notas de aplicação'] && (jsonObj['Notas de aplicação'] != "")) {
            var textoNA = jsonObj['Notas de aplicação']
            naList = textoNA.replace(/(\r\n|\n|\r)/gm,"").split("#")
            var naTriples = ""
                    
            for(var na=0, len = naList.length; na<len; na++)
                {
                    if(naList[na]){
                        // criar as instâncias das notas de aplicação
                        var naCode = "na_" + classCode + "_"  + nanoid()
                        naTriples = ""
                        naTriples += "###  http://jcr.di.uminho.pt/m51-clav#" + naCode + "\n"
                        naTriples += ":" + naCode + " rdf:type owl:NamedIndividual ,\n"
                        naTriples += "\t\t:NotaAplicacao ;\n"
                        naTriples += "\t:rdfs:label \"Nota de Aplicação\";\n"
    
                        var naLimpa = naList[na].replace(/\"/g,"\\\"")
                        naTriples += "\t:conteudo " + "\"" + naLimpa + "\".\n\n"

                        // criar as relações com das notas de aplicação com a classe
                        naTriples += ":" + classCode +" :temNotaAplicacao " + ":" + naCode + " .\n"

                        fs.appendFile(fout, naTriples , function(err){
                            if(err)
                                console.error(err);
                        });
                    }
        
                }
        }
    return naList;
}

// --------------------------------------------------------------------------
exports.migraExNA = function(classCode, jsonObj, fout)
{
    var exNAList = []

    if (jsonObj['Exemplos de NA']) {
            var textoExNA = jsonObj['Exemplos de NA']
            exNAList = textoExNA.replace(/(\r\n|\n|\r)/gm,"").split("#")
            var exNATriples = ""
                    
            for(var exna=0, len = exNAList.length; exna<len; exna++)
                {
                    if(exNAList[exna]){
                        // criar as instâncias para os exemplos das notas de aplicação
                        var exnaCode = "exna_" + classCode + "_" + nanoid()
                        exNATriples = ""
                        exNATriples += "###  http://jcr.di.uminho.pt/m51-clav#" + exnaCode + "\n"
                        exNATriples += ":" + exnaCode + " rdf:type owl:NamedIndividual ,\n"
                        exNATriples += "\t:ExemploNotaAplicacao ;\n"
                        exNATriples += "\t:rdfs:label \"Exemplo de nota de aplicação\";\n"
                        exNATriples += "\t:conteudo " + "\"" + exNAList[exna] + "\".\n\n"

                        // criar as relações com dos exemplos das notas de aplicação com a classe
                        exNATriples += ":" + classCode +" :temExemploNA " + ":" + exnaCode + " .\n"

                        
                        fs.appendFile(fout, exNATriples , function(err){
                            if(err)
                                console.error(err);
                        });
                    }
        
                }
        }
    return exNAList
}

// ------------------------------------------------------------------------------------
exports.migraNE = function(classCode, jsonObj, fout)
{
    var neList = []
    if (jsonObj['Notas de exclusão']) {
            var textoNE = jsonObj['Notas de exclusão']
            neList = textoNE.replace(/(\r\n|\n|\r)/gm,"").split("#")
            var neTriples = ""
                    
            for(var ne=0, len = neList.length; ne<len; ne++)
                {
                    if(neList[ne]){
                        // criar as instâncias das notas de exclusão
                        var neCode = "ne_" + classCode + "_" + nanoid()
                        neTriples = ""
                        neTriples += "###  http://jcr.di.uminho.pt/m51-clav#" + neCode + "\n"
                        neTriples += ":" + neCode + " rdf:type owl:NamedIndividual ,\n"
                        neTriples += "\t:NotaExclusao ;\n"
                        neTriples += "\t:rdfs:label \"Nota de Exclusão\";\n"
                        
                        var neLimpa = neList[ne].replace(/\"/g,"\\\"")
                        neTriples += "\t:conteudo " + "\"" + neLimpa + "\".\n\n"

                        // criar as relações com das notas de exclusão com a classe
                        neTriples += ":" + classCode +" :temNotaExclusao " + ":" + neCode + " .\n"

                        fs.appendFile(fout, neTriples , function(err){
                            if(err)
                                console.error(err);
                        });
                    }
        
                }
        }
    return neList
}