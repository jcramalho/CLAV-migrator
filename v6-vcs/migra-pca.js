const csv = require('csvtojson')
const fs = require('fs')
const jfile = require("jsonfile")

// Carregamento do catálogo legislativo
var leg_file = "../dados/json/leg.json"
var Legislacao = []
// Varáveis
var fout = "unspecified"
var csvFilePath = "unspecified"
var pcaTriples = ""
var classes3 = []

// Ficheiro de saída
if (process.argv.length < 3){
    console.log('Atenção: não especificou a classe a migrar')
}
else{
    csvFilePath = "../dados/csvs/"+process.argv[2]+"-utf8.csv"
    fout = '../dados/ontologia/c'+process.argv[2]+'-pca.ttl'
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
                var pcaCode = "pca_c" + cod
                
                if(classe == 3)
                {
                    if(cod == "400.10.001"){
                        pcaTriples += proc_c400_10_001(pcaCode, cod)
                    }
                    else{
                        if(jsonObj['Prazo de conservação administrativa']){
                            pcaTriples += procPCA(jsonObj, pcaCode, cod)
                        }
                        else{
                            // Registar a classe para tratar o nível 4
                            classes3.push(cod)
                        }
                    }     
                }
                else if(classe == 4){
                    var sep = cod.lastIndexOf(".")
                    var pai = cod.slice(0,sep)
                    var index = classes3.indexOf(pai)
                    if(index > -1){
                        if(jsonObj['Prazo de conservação administrativa']){
                            pcaTriples += procPCA(jsonObj, pcaCode, cod)
                        }
                        else if(jsonObj['Nota ao PCA']){
                            console.error('WARN: PCA descrito em nota: ' + cod)
                        }
                        else{
                            // ERRO: nível 3 e nível 4 sem PCA
                            console.error('ERRO: classe sem PCA: ' + cod)
                        }
                    }
                }
            }
        })
        .on('done', (err)=>{
            fs.appendFile(fout, pcaTriples , function(err){
                if(err)
                    console.error(err)
                else
                    console.log(fout+" Gravado!")
            }) 
        })
    }
    
})


// Migração do PCA_____________________________________________________________

function procPCA(data, pcaCode, cod){

    var myTriples = "###  http://jcr.di.uminho.pt/m51-clav#" + pcaCode + "\n"
    myTriples += ":" + pcaCode + " rdf:type owl:NamedIndividual ,\n"
    myTriples += "\t:PCA ;\n"
    
    if(data['Nota ao PCA']){
        myTriples += "\t:pcaValor " + data['Prazo de conservação administrativa'] + ";\n"
        myTriples += "\t:pcaNota " + "\"" + data['Nota ao PCA'].replace(/"/g, "\\\"") + "\".\n\n"
    }
    else{
        myTriples += "\t:pcaValor " + data['Prazo de conservação administrativa'] + ".\n"
    }
    myTriples += ":c" + cod + " :temPCA :" + pcaCode + ".\n"

    var myContagem = data['Forma de contagem do PCA normalizada']
    //console.log(myContagem)
    if(myContagem){
        var re_fc_concProc = /conclusão.*procedimento/
        var re_fc_cessVig = /cessação.*vigência/
        var re_fc_extEnt = /extinção.*entidade/
        var re_fc_extDir = /extinção.*direito/
        var re_fc_dispLeg = /disposição.*legal/
        var re_fc_inicProc = /início.*procedimento/
        var re_fc_emiTit = /emissão.*título/

        if(re_fc_concProc.test(myContagem)){
            myTriples += ":" + pcaCode + " :pcaFormaContagemNormalizada :vc_pcaFormaContagem_conclusaoProcedimento .\n"
        } else if(re_fc_dispLeg.test(myContagem)){
            myTriples += ":" + pcaCode + " :pcaFormaContagemNormalizada :vc_pcaFormaContagem_disposicaoLegal .\n"

            var linhasSubforma = myContagem.split('\n')
            linhasSubforma.splice(0,1)
            var mySubforma = linhasSubforma.join('\n')
            if(mySubforma.trim().startsWith('1',0)){
                myTriples += ":" + pcaCode + " :pcaSubformaContagem :vc_pcaSubformaContagem_F01.01 .\n"
            } else if(mySubforma.trim().startsWith('2',0)){
                myTriples += ":" + pcaCode + " :pcaSubformaContagem :vc_pcaSubformaContagem_F01.02 .\n"
            } else if(mySubforma.trim().startsWith('3',0)){
                myTriples += ":" + pcaCode + " :pcaSubformaContagem :vc_pcaSubformaContagem_F01.03 .\n"
            } else if(mySubforma.trim().startsWith('4',0)){
                myTriples += ":" + pcaCode + " :pcaSubformaContagem :vc_pcaSubformaContagem_F01.04 .\n"
            } else if(mySubforma.trim().startsWith('5',0)){
                myTriples += ":" + pcaCode + " :pcaSubformaContagem :vc_pcaSubformaContagem_F01.05 .\n"
            } else if(mySubforma.trim().startsWith('6',0)){
                myTriples += ":" + pcaCode + " :pcaSubformaContagem :vc_pcaSubformaContagem_F01.06 .\n"
            } else if(mySubforma.trim().startsWith('7',0)){
                myTriples += ":" + pcaCode + " :pcaSubformaContagem :vc_pcaSubformaContagem_F01.07 .\n"
            } else if(mySubforma.trim().startsWith('8',0)){
                myTriples += ":" + pcaCode + " :pcaSubformaContagem :vc_pcaSubformaContagem_F01.08 .\n"
            } else if(mySubforma.trim().startsWith('9',0)){
                myTriples += ":" + pcaCode + " :pcaSubformaContagem :vc_pcaSubformaContagem_F01.09 .\n"
            } else if(mySubforma.trim().startsWith('10',0)){
                myTriples += ":" + pcaCode + " :pcaSubformaContagem :vc_pcaSubformaContagem_F01.10 .\n"
            } else if(mySubforma.trim().startsWith('11',0)){
                myTriples += ":" + pcaCode + " :pcaSubformaContagem :vc_pcaSubformaContagem_F01.11 .\n"
            } else if(mySubforma.trim().startsWith('12',0)){
                myTriples += ":" + pcaCode + " :pcaSubformaContagem :vc_pcaSubformaContagem_F01.12 .\n"
            } else{
                console.log('ERRO: Subforma de contagem inválida: ' + mySubforma + ' em ' + pcaCode)
            }
        } else if(re_fc_extEnt.test(myContagem)){
            myTriples += ":" + pcaCode + " :pcaFormaContagemNormalizada :vc_pcaFormaContagem_extincaoEntidade .\n"
        } else if(re_fc_extDir.test(myContagem)){
            myTriples += ":" + pcaCode + " :pcaFormaContagemNormalizada :vc_pcaFormaContagem_extincaoDireito .\n"
        } else if(re_fc_cessVig.test(myContagem)){
            myTriples += ":" + pcaCode + " :pcaFormaContagemNormalizada :vc_pcaFormaContagem_cessacaoVigencia .\n"
        } else if(re_fc_inicProc.test(myContagem)){
            myTriples += ":" + pcaCode + " :pcaFormaContagemNormalizada :vc_pcaFormaContagem_inicioProcedimento .\n"
        } else if(re_fc_emiTit.test(myContagem)){
            myTriples += ":" + pcaCode + " :pcaFormaContagemNormalizada :vc_pcaFormaContagem_emissaoTitulo .\n"
        } else{
            console.log('ERRO: Forma de contagem inválida: ' + myContagem + ' em ' + pcaCode)
        }
    } 
    
    if(data['Justificação PCA']){
        myTriples += procJustPCA(data['Justificação PCA'], pcaCode)
    }       
    
    return myTriples
}

// Migração da Justificação ao PCA______________________________________
const Lexer = require('lex')

function procJustPCA(justificacao, pcaCode){
    var justCode = "just_" + pcaCode
    var myTriples = ""
    var critCont = 1
    var critCode = ""

    // analex que que trata as referências das justificações à legislação e aos processos
    var lex_refs = new Lexer 
    lex_refs.addRule(/\[[a-zA-Z0-9\-\/ ]+\]/, function(lexema){
        var legRef = lexema.substring(1, lexema.length-1)
        var indice = Legislacao.findIndex(legrec => legrec.id == legRef)
        if(indice > -1)
            myTriples += ":"+critCode+" :critTemLegAssoc :" + Legislacao[indice].codigo +".\n" 
        else
            console.error('Erro de legRef: (ref: '+legRef+', crit: '+critCode+')')
    }).addRule(/\d{3}\.\d{2,3}\.\d{3}/, function(lexema){
        myTriples += ":"+critCode+" :critTemProcRel :c"+lexema+".\n"
    }).addRule(/./, function(lexema){
        //pcaTriples += "\t Outro...\n"
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
    }).addRule(/#Critério gestionário:[^#]+/, function(lexema){
        critCode = "crit_" + justCode + "_" + parseInt(critCont)
        critCont++
        myTriples += ":" + critCode + " rdf:type owl:NamedIndividual ,\n"
        myTriples += "\t:CriterioJustificacaoGestionario;\n"
        myTriples += "\t:conteudo \""+lexema.substring(22).replace(/"/g, "\\\"")+"\".\n"
        myTriples += ":" + justCode + " :temCriterio :" + critCode + ".\n"
        lex_refs.setInput(lexema).lex()
    }).addRule(/#Critério de utilidade administrativa:[^#]+/, function(lexema){
        critCode = "crit_" + justCode + "_" + parseInt(critCont)
        critCont++
        myTriples += ":" + critCode + " rdf:type owl:NamedIndividual ,\n"
        myTriples += "\t:CriterioJustificacaoUtilidadeAdministrativa;\n"
        myTriples += "\t:conteudo \""+lexema.substring(38).replace(/"/g, "\\\"")+"\".\n"
        myTriples += ":" + justCode + " :temCriterio :" + critCode + ".\n"
        lex_refs.setInput(lexema).lex()
    }).addRule(/./, function(lexema){
        //pcaTriples += "\t Outro...\n"
    })

    myTriples += "###  http://jcr.di.uminho.pt/m51-clav#" + justCode + "\n"
    myTriples += ":" + justCode + " rdf:type owl:NamedIndividual ,\n"
    myTriples += "\t:JustificacaoPCA.\n"
    
    myTriples += ":" + pcaCode + " :temJustificacao :" + justCode + ".\n"

    var texto = justificacao.replace(/(\r\n|\n|\r)/gm,"")
    lex_criterios.setInput(texto).lex()
    return myTriples
}

// Migração do Processo c400.10.001______________________________________

function proc_c400_10_001(pcaCode, cod){
    var myTriples = "###  http://jcr.di.uminho.pt/m51-clav#" + pcaCode + "\n"
    myTriples += ":" + pcaCode + " rdf:type owl:NamedIndividual ,\n"
    myTriples += "\t:PCA ;\n"
    myTriples += "\t:pcaValor 30;\n"
    myTriples += "\t:pcaValor 50;\n"
    myTriples += "\t:pcaValor 100;\n"
    myTriples += "\t:pcaNota \"30 anos após a data do assento de óbito\";\n"
    myTriples += "\t:pcaNota \"50 anos sobre a data do registo de casamento\";\n"
    myTriples += "\t:pcaNota \"100 anos após a data do assento de nascimento\".\n"
    myTriples += ":" + pcaCode + " :pcaFormaContagemNormalizada :vc_pcaFormaContagem_disposicaoLegal .\n"
    myTriples += ":" + pcaCode + " :pcaSubformaContagem :vc_pcaSubformaContagem_F01.01 .\n"
    myTriples += ":" + pcaCode + " :pcaFormaContagem \"(1) Data do assento de óbito (2) Data do registo de casamento. (3) Data do assento de nascimento. No caso dos registos em livro os prazos contam-se a partir da data do último assento lavrado no livro.\".\n"
    myTriples += ":c" + cod + " :temPCA :" + pcaCode + ".\n"
    // Justificação do PCA
    myTriples += "###  http://jcr.di.uminho.pt/m51-clav#just_pca_c400.10.001\n"
    myTriples += ":just_pca_c400.10.001 rdf:type owl:NamedIndividual ,\n"
    myTriples += "\t:JustificacaoPCA.\n"
    myTriples += ":pca_c400.10.001 :temJustificacao :just_pca_c400.10.001.\n"
    // Critério
    myTriples += ":crit_just_pca_c400.10.001_1 rdf:type owl:NamedIndividual ,\n"
    myTriples += "\t:CriterioJustificacaoLegal;\n"
    myTriples += "\t:conteudo \"[DL 324/2007], artº 15; 1 - Os livros cujos registos tenham sido objecto de informatização são transferidos para a entidade responsável pelos arquivos nacionais; 2 - O disposto no número anterior é aplicável aos livros de registo relativamente aos quais tenha decorrido, à data do último assento: a) Mais de 30 anos, quanto aos livros de assentos de óbito; b) Mais de 50 anos, quanto aos livros de assentos de casamento; c) Mais de 100 anos, quanto aos restantes livros de assentos; 3 - O disposto no número anterior é aplicável aos documentos que tenham servido de base aos assentos nele referidos; (Tem por base o tempo médio de vida da pessoa, visa a utilidade gestionária esgotando quase na totalidade as necessidades administrativas de consulta).\".\n"
    myTriples += ":crit_just_pca_c400.10.001_1 :temLegislacao :leg_602.\n"
    myTriples += ":just_pca_c400.10.001 :temCriterio :crit_just_pca_c400.10.001_1 .\n"
    // Destino Final
    myTriples += "###  http://jcr.di.uminho.pt/m51-clav#df_c400.10.001\n"
    myTriples += ":df_c400.10.001 rdf:type owl:NamedIndividual ,\n"
    myTriples += "\t:DestinoFinal ;\n"
    myTriples += "\t:dfValor \"C\".\n"
    myTriples += ":c400.10.001 :temDF :df_c400.10.001 .\n"
    // Justificação do Destino Final
    myTriples += "###  http://jcr.di.uminho.pt/m51-clav#just_df_c400.10.001\n"
    myTriples += ":just_df_c400.10.001 rdf:type owl:NamedIndividual ,\n"
    myTriples += "\t\t:JustificacaoDF.\n"
    
    myTriples += ":df_c400.10.001 :temJustificacao :just_df_c400.10.001 .\n"

    myTriples += ":crit_just_df_c400.10.001_1 rdf:type owl:NamedIndividual ,\n"
    myTriples += "\t:CriterioJustificacaoLegal;\n"
    myTriples += "\t:conteudo \"Código Civil, [DL 47344/66] (conservação para garante do exercício dos direitos de personalidade. Consagram direitos que não prescrevem no tempo).\".\n"
    myTriples += ":just_df_c400.10.001 :temCriterio :crit_just_df_c400.10.001_1 .\n"
    myTriples += ":crit_just_df_c400.10.001_1 :temLegislacao :leg_6.\n"

    return myTriples
}
