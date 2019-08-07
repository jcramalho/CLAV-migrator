const csv = require('csvtojson')
const fs = require('fs')
const Lexer = require('lex')

var pcaTriples = ""

// analex que que trata as referências das justificações à legislação e aos processos
var lex_refs = new Lexer 
lex_refs.addRule(/\[[a-zA-Z0-9\-\/ ]+\]/, function(lexema){
    console.log("Ref:"+lexema.substring(1, lexema.length-1))
    pcaTriples += "\t\t Ref:"+lexema.substring(1, lexema.length-1)+"\n"
}).addRule(/PN\s*\d{3}\.\d{2,3}\.\d{3}/, function(lexema){
    console.log("Proc:"+lexema)
    pcaTriples += "\t\t Processo:"+lexema+"\n"
}).addRule(/\d{3}\.\d{2,3}\.\d{3}/, function(lexema){
    console.log("Proc:"+lexema)
    pcaTriples += "\t\t Processo:"+lexema+"\n"
}).addRule(/./, function(lexema){
    //pcaTriples += "\t Outro...\n"
})

// analex que faz a migração dos critérios
var lex_criterios = new Lexer 
lex_criterios.addRule(/#Critério legal:[^#]+/, function(lexema){
    pcaTriples += "\t Critério legal:"+lexema.substring(16)+"\n"
    console.log('Processando: ' + lexema)
    lex_refs.setInput(lexema).lex()
}).addRule(/#Critério de utilidade administrativa:[^#]+/, function(lexema){
    pcaTriples += "\t Critério de utilidade administrativa:"+lexema.substring(38)+"\n"
    console.log('Processando: ' + lexema)
    lex_refs.setInput(lexema).lex()
}).addRule(/./, function(lexema){
    //pcaTriples += "\t Outro...\n"
})

var classe = "400"

const csvFilePath = "../dados/csvs/" + classe + "-utf8.csv"
// Ficheiro de saída
var fout = '../dados/ontologia/c' + classe + '-pca-just.ttl'

csv({delimiter:";"})
.fromFile(csvFilePath)
.on('json', (jsonObj, rowIndex)=> {
    if ((jsonObj['Estado'].trim()=='') && jsonObj['Código']) { // Se é uma linha com info de classe
        var m = require("./mod-migra.js")
        var cod = "" + jsonObj['Código'].replace(/(\r\n|\n|\r)/gm,"")
        var classe = m.calcClasse(cod)
        var pcaCode = "pca_c" + cod
        pcaTriples = ""
        
        if(classe == 3)
        {
            if(cod == "400.10.001"){
            }
            else{
                if(jsonObj['Prazo de conservação administrativa']){
                    if(jsonObj['Justificação PCA']){
                        var texto = jsonObj['Justificação PCA'].replace(/(\r\n|\n|\r)/gm,"")
                        //console.log("TEXTO: "+texto+"\n\n" )
                        pcaTriples += "-------------------------"+cod+"-------------------\n"
                        lex_criterios.setInput(texto).lex()
                    }
                }
            }   
            fs.appendFile(fout, pcaTriples , function(err){
                if(err)
                    console.error(err)
            })   
        }
    }
})

