const csv = require('csvtojson')
const fs = require('fs')
const jfile = require("jsonfile")

// Carregamento do catálogo legislativo
var leg_file = "../dados/json/leg.json"
var Legislacao = []
// Varáveis
var fout = "unspecified"
var csvFilePath = "unspecified"
var dfTriples = ""
var classes3 = []

// Ficheiro de saída
if (process.argv.length < 3){
    console.log('Atenção: não especificou a classe a migrar')
}
else{
    csvFilePath = "../dados/csvs/"+process.argv[2]+"-utf8.csv"
    fout = '../dados/ontologia/c'+process.argv[2]+'-df.ttl'
}
    
jfile.readFile(leg_file, function(err, legCatalog){
    if(err)
        console.log(err)
    else{
        Legislacao = legCatalog
        
        csv({delimiter:";"})
        .fromFile(csvFilePath)
        .on('json', (jsonObj, rowIndex)=> {
            if ((jsonObj['Estado'].trim()=='') && jsonObj['Código']) { // Se é uma linha com info de classe
                var m = require("./mod-migra.js")
                var cod = "" + jsonObj['Código'].replace(/(\r\n|\n|\r)/gm,"")
                var classe = m.calcClasse(cod)
                var dfCode = "df_c" + cod
                
                if(classe == 3)
                {
                    if(jsonObj['Destino final']){
                        dfTriples += procDF(jsonObj, dfCode, cod)
                    }
                    else{
                        // Registar a classe para tratar o nível 4
                        classes3.push(cod)
                    }
                }
                else if(classe == 4){
                    var sep = cod.lastIndexOf(".")
                    var pai = cod.slice(0,sep)
                    var index = classes3.indexOf(pai)
                    if(index > -1){
                        //classes3.splice(index, 1)
                        if(jsonObj['Destino final']){
                            dfTriples += procDF(jsonObj, dfCode, cod)
                        }
                        else{
                            // ERRO: nível 3 e nível 4 sem PCA
                            console.error('ERRO: classe sem DF: ' + cod)
                        }
                    }
                }
            }
        })
        .on('done', (err)=>{
            fs.appendFile(fout, dfTriples , function(err){
                if(err)
                    console.error(err)
                else
                    console.log(fout+" Gravado!")
            }) 
        })
    }
    
})


// Migração do DF_____________________________________________________________

function procDF(data, dfCode, cod){
    var myTriples = "###  http://jcr.di.uminho.pt/m51-clav#" + dfCode + "\n"
    myTriples += ":" + dfCode + " rdf:type owl:NamedIndividual ,\n"
    myTriples += "\t:DestinoFinal"
    myTriples += " ;\n\t:dfValor \"" + data['Destino final'].replace(/(\r\n|\n|\r)/gm,"") + "\""
    if(data['Nota ao DF']){
        myTriples += ";\n\t:dfNota \"" + data['Nota ao DF'].replace(/(\r\n|\n|\r)/gm,"") + "\".\n"
    }
    else{
        myTriples += ".\n"
    }
    
    myTriples += ":c" + cod + " :temDF :" + dfCode + ".\n"
    if(data['Justificação DF']){
        myTriples += procJustDF(data['Justificação DF'], dfCode)
    }
    return myTriples
}

// Migração da Justificação ao DF______________________________________
const Lexer = require('lex')

function procJustDF(justificacao, dfCode){
    var justCode = "just_" + dfCode
    var myTriples = ""
    var critCont = 1
    var critCode = ""

    // analex que que trata as referências das justificações à legislação e aos processos
    var lex_refs = new Lexer 
    lex_refs.addRule(/\[[a-zA-Z0-9\-\/ ]+\]/, function(lexema){
        var legRef = lexema.substring(1, lexema.length-1)
        var indice = Legislacao.findIndex(legrec => legrec.id == legRef)
        if(indice > -1)
            myTriples += ":"+critCode+" :critTemLegAssoc :" + Legislacao[indice].codigo + ".\n" 
        else
            console.error('Erro de legRef: (ref: '+legRef+', crit: '+critCode+')')
    }).addRule(/\d{3}\.\d{2,3}\.\d{3}/, function(lexema){
        myTriples += ":"+critCode+" :critTemProcRel :c"+lexema+".\n"
    }).addRule(/\d{3}\.\d{2,3}\.\d{3}\.\d{2}/, function(lexema){
        myTriples += ":"+critCode+" :critTemProcRel :c"+lexema+".\n"
    }).addRule(/./, function(lexema){
        //dfTriples += "\t Outro...\n"
    })

    // analex que faz a migração dos critérios
    var lex_criterios = new Lexer 
    lex_criterios.addRule(/#Critério legal:[^#]+/, function(lexema){
        critCode = "crit_" + justCode + "_" + parseInt(critCont)
        critCont++
        myTriples += ":" + critCode + " rdf:type owl:NamedIndividual ,\n"
        myTriples += "\t:CriterioJustificacaoLegal;\n"
        myTriples += "\t:conteudo \""+lexema.substring(16).replace(/"/g, "\\\"")+"\".\n"
        myTriples += ":" + justCode + " :temCriterio :" + critCode + ".\n"
        lex_refs.setInput(lexema).lex()
    }).addRule(/#Critério de densidade informacional:[^#]+/, function(lexema){
        critCode = "crit_" + justCode + "_" + parseInt(critCont)
        critCont++
        myTriples += ":" + critCode + " rdf:type owl:NamedIndividual ,\n"
        myTriples += "\t:CriterioJustificacaoDensidadeInfo;\n"
        myTriples += "\t:conteudo \""+lexema.substring(37).replace(/"/g, "\\\"")+"\".\n"
        myTriples += ":" + justCode + " :temCriterio :" + critCode + ".\n"
        lex_refs.setInput(lexema).lex()
    }).addRule(/#Critério de complementaridade informacional:[^#]+/, function(lexema){
        critCode = "crit_" + justCode + "_" + parseInt(critCont)
        critCont++
        myTriples += ":" + critCode + " rdf:type owl:NamedIndividual ,\n"
        myTriples += "\t:CriterioJustificacaoComplementaridadeInfo;\n"
        myTriples += "\t:conteudo \""+lexema.substring(46).replace(/"/g, "\\\"")+"\".\n"
        myTriples += ":" + justCode + " :temCriterio :" + critCode + ".\n"
        
        lex_refs.setInput(lexema).lex()
        
    }).addRule(/./, function(lexema){
        //pcaTriples += "\t Outro...\n"
    })

    myTriples += "###  http://jcr.di.uminho.pt/m51-clav#" + justCode + "\n"
    myTriples += ":" + justCode + " rdf:type owl:NamedIndividual ,\n"
    myTriples += "\t:JustificacaoDF.\n"
    
    myTriples += ":" + dfCode + " :temJustificacao :" + justCode + ".\n"

    var texto = justificacao.replace(/(\r\n|\n|\r)/gm," ")
    lex_criterios.setInput(CapitalizaStr(texto)).lex()
    return myTriples
}

// Função que capitaliza a string argumento
function CapitalizaStr(string) 
{
    var mystr = string.trim()
    return mystr.charAt(0).toUpperCase() + mystr.slice(1);
}