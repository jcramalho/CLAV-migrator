exports.migraClasse = function(entCatalog, legCatalog, tipCatalog, classe)
{
    const csv = require('csvtojson')
    const fs = require('fs')

    // Processamento do ficheiro de classes ...........................
    const csvFilePath = "../dados/csvs/" + classe + "-utf8.csv"
    // Ficheiro de saída
    var fout = '../dados/ontologia/c' + classe + '.ttl'

    // Header
    fs.writeFile(fout, '### Classe' + classe + '\n', function(err){
        if(err)
            console.error(err)
        console.log('Classe ' + classe + ': Comecei a processar');
    })

    // Por omissão, a primeira linha é a lista de chaves:
    // Estado;Código;Título;Descrição;Notas de aplicação;Exemplos de NA;Notas de exclusão;
    // Diplomas jurídico-administrativos REF;Diplomas jurídico-administrativos complementar;
    // Tipo de processo;Processo transversal (S/N);Dono do processo;Participante no processo;
    // Tipo de intervenção do participante;Código do processo relacionado;Título do processo relacionado;
    // Tipo de relação entre processos;Dimensão qualitativa do processo;Uniformização do processo;
    // Prazo de conservação administrativa;Nota ao PCA;Justificação PCA;
    // Normalização Forma de contagem do prazo de cons. adm.;Forma de contagem do prazo de cons. adm.;
    // Destino final;Justificação DF;Notas
    csv({delimiter:";"})
        .fromFile(csvFilePath)
        .on('json', (jsonObj, rowIndex)=> {
            if ((jsonObj['Estado'].trim()=='') && jsonObj['Código']) { // Se é uma linha com info de classe
                var m = require("./mod-migra.js")
                var cod = "" + jsonObj['Código'].replace(/(\r\n|\n|\r)/gm,"")
                var classe = m.calcClasse(cod)
                var classTriples = ""
                
                if(classe)
                {
                    var classCode = "c" + cod
                    
                    // tratamento das notas de aplicação
                    var naList = m.migraNA(classCode, jsonObj, fout)
    
                    // tratamento dos exemplos das notas de aplicação
                    var exNAList = m.migraExNA(classCode, jsonObj, fout)
    
                    // tratamento das notas de exclusão
                    var neList = m.migraNE(classCode, jsonObj, fout)
    
                    // Geração dos triplos da classe: Data Properties
                    classTriples += "###  http://jcr.di.uminho.pt/m51-clav#" + classCode + "\n"
                    classTriples += ":" + classCode + " rdf:type owl:NamedIndividual ,\n"
                    classTriples += "\t:Classe_N" + classe + ";\n"
                    classTriples += "\t:codigo " + "\"" + cod + "\";\n"
                    classTriples += "\t:titulo " + "\"" + jsonObj['Título'].replace(/(\r\n|\n|\r)/gm,"") + "\";\n"
            
                    //cálculo da relação hierárquica
                    switch(classe)
                    {
                        case 1: 
                            classTriples += "\t:pertenceLC :lc1 ;\n"
                            classTriples += "\t:temPai :lc1 ;\n"
                            break
                        case 2: 
                            var sep = cod.lastIndexOf(".")
                            var pai = cod.slice(0,sep)
                            classTriples += "\t:pertenceLC :lc1 ;\n"
                            classTriples += "\t:temPai :c" + pai + " ;\n"
                            break
                        case 3:
                            var sep = cod.lastIndexOf(".")
                            var pai = cod.slice(0,sep)
                            classTriples += "\t:pertenceLC :lc1 ;\n"
                            classTriples += "\t:temPai :c" + pai + " ;\n"

                            // Atributos obrigatórios para classes de nível 3
                            //    - são migrados mais à frente
                            if (!jsonObj['Dimensão qualitativa do processo'])
                                console.warn('WARN: ' + classCode + ': Dimensão qualitativa do processo vazia.')
                            if (!jsonObj['Uniformização do processo'])
                                console.warn('WARN: ' + classCode + ': Uniformização do processo vazia.')

                            // Tipo de processo: PC, PE
                            if (jsonObj['Tipo de processo']) {
                                var myTipoProc = jsonObj['Tipo de processo'].trim()
                                switch (myTipoProc)
                                {
                                    case "PC":
                                        classTriples += "\t:processoTipoVC :vc_processoTipo_pc ;\n"
                                        break
                                    case "PE":
                                        classTriples += "\t:processoTipoVC :vc_processoTipo_pe ;\n"
                                        break
                                    default: 
                                        console.error('ERRO: tipo de processo desconhecido: ' + myTipoProc)
                                }
                                
                            } else {
                                console.warn(cod + ': Tipo de processo vazio.')
                            }
                            // Transversal: S/N
                            if (jsonObj['Processo transversal (S/N)']) {
                                classTriples += "\t:processoTransversal " + "\"" + jsonObj['Processo transversal (S/N)'] + "\" ;\n"
                                if(jsonObj['Processo transversal (S/N)'] == 'S'){
                                    // Participante(s) do processo
                                    if (jsonObj['Participante no processo']) {
                                        var excel = jsonObj['Participante no processo']
                                        var parts = excel.replace(/(\r\n|\n|\r)/gm,"").replace(/\.| |,/gm,"_").split("#")
                                        var excelTipo = jsonObj['Tipo de intervenção do participante']
                                        var tipos = excelTipo.replace(/(\r\n|\n|\r)/gm,"").split("#")
    
                                        for(var p=0, len = parts.length; p<len; p++)
                                        {
                                            if(parts[p]){
                                                // Verificação da existência no catálogo de entidades
                                                if(entCatalog.indexOf(parts[p])!= -1){
                                                    var i = entCatalog.indexOf(parts[p])
                                                    var prefixo = "ent_"
                                                // tipo de participação
                                                    if (tipos[p]) {
                                                        switch (tipos[p]) {
                                                            case 'Apreciar':
                                                                classTriples += "\t:temParticipanteApreciador :" + prefixo + parts[p] + " ;\n"
                                                                break;
                                                            case 'Assessorar':
                                                                classTriples += "\t:temParticipanteAssessor :" + prefixo + parts[p] + " ;\n"
                                                                break
                                                            case 'Comunicar':
                                                                classTriples += "\t:temParticipanteComunicador :" + prefixo + parts[p] + " ;\n"
                                                                break
                                                            case 'Decidir':
                                                                classTriples += "\t:temParticipanteDecisor :" + prefixo + parts[p] + " ;\n"
                                                                break
                                                            case 'Executar':
                                                                classTriples += "\t:temParticipanteExecutor :" + prefixo + parts[p] + " ;\n"
                                                                break
                                                            case 'Iniciar':
                                                                classTriples += "\t:temParticipanteIniciador :" + prefixo + parts[p] + " ;\n"
                                                                break
                                                            default:
                                                                console.warn(cod + ': Entidade ' + parts[p] + " tem intervenção mal definida.")
                                                                break;
                                                        }
                                        
                                                    } else {
                                                        console.warn(cod + ': Entidade ' + parts[p] + " não tem intervenção definida.")
                                                    }
                                                }
                                                else if(tipCatalog.indexOf(parts[p])!= -1){
                                                    var i = tipCatalog.indexOf(parts[p])
                                                    var prefixo = "tip_"
                                                // tipo de participação
                                                    if (tipos[p]) {
                                                        switch (tipos[p]) {
                                                            case 'Apreciar':
                                                                classTriples += "\t:temParticipanteApreciador :" + prefixo + parts[p] + " ;\n"
                                                                break;
                                                            case 'Assessorar':
                                                                classTriples += "\t:temParticipanteAssessor :" + prefixo + parts[p] + " ;\n"
                                                                break
                                                            case 'Comunicar':
                                                                classTriples += "\t:temParticipanteComunicador :" + prefixo + parts[p] + " ;\n"
                                                                break
                                                            case 'Decidir':
                                                                classTriples += "\t:temParticipanteDecisor :" + prefixo + parts[p] + " ;\n"
                                                                break
                                                            case 'Executar':
                                                                classTriples += "\t:temParticipanteExecutor :" + prefixo + parts[p] + " ;\n"
                                                                break
                                                            case 'Iniciar':
                                                                classTriples += "\t:temParticipanteIniciador :" + prefixo + parts[p] + " ;\n"
                                                                break
                                                            default:
                                                                console.warn(cod + ': Tipologia ' + parts[p] + " tem intervenção mal definida.")
                                                                break;
                                                        }
                                        
                                                    } else {
                                                        console.warn(cod + ': Tipologia ' + parts[p] + " não tem intervenção definida.")
                                                    }
                                                }
                                                else
                                                    console.warn(cod + ': Entidade ou Tipologia ' + parts[p] + " não está no catálogo.")
                                        }
                                            }
                                            
                                    } else {
                                        console.warn('Warning: ' + cod + ': Processo sem participantes.')
                                    }
                                }
    
                            } else {
                                console.warn(cod + ': Transversalidade vazia.')
                            }
                            // Dono(s) do processo
                            if (jsonObj['Dono do processo']) {
                                var excel = jsonObj['Dono do processo']
                                var donos = excel.replace(/(\r\n|\n|\r)/gm,"").replace(/\.| |,/gm,"_").split("#")
                                for(var d=0, len = donos.length; d<len; d++)
                                {
                                    if(donos[d])
                                        // Verificação da existência no catálogo organizativo
                                        if(entCatalog.indexOf(donos[d])!= -1){
                                            var i = entCatalog.indexOf(donos[d])
                                            var prefixo = "ent_"
                                            classTriples += "\t:temDono :" + prefixo + donos[d] + " ;\n"
                                        }
                                        else if(tipCatalog.indexOf(donos[d])!= -1){
                                            var i = tipCatalog.indexOf(donos[d])
                                            var prefixo = "tip_"
                                            classTriples += "\t:temDono :" + prefixo + donos[d] + " ;\n"
                                        }
                                            
                                        else
                                            console.warn(cod + ': Entidade ou Tipologia ' + donos[d] + " não está no catálogo.")
                                }
                            } else {
                                console.warn('Warning: ' + cod + ': Processo sem dono especificado.')
                            }
                            break
                        case 4:
                            var sep = cod.lastIndexOf(".")
                            var pai = cod.slice(0,sep)
                            classTriples += "\t:pertenceLC :lc1 ;\n"
                            classTriples += "\t:temPai :c" + pai + " ;\n"
                            break
                    }
    
                    // Relações com os outros Processos
                    if(jsonObj['Código do processo relacionado']){
                        var procRefs = jsonObj['Código do processo relacionado']
                        var procRefsSplit = procRefs.replace(/(\r\n|\n|\r|\s)/gm,"").split("#")
                        var procTipos = jsonObj['Tipo de relação entre processos']
                        var procTiposSplit = procTipos.replace(/(\r\n|\n|\r)/gm,"").split("#")
    
                        if(procRefsSplit.length != procTiposSplit.length) {
                            console.error(classCode + " :: tem " + procRefsSplit.length + " processos relacionados mas " + procTiposSplit.length + " tipos de relação.")
                            // Vou criar a relação de alto nível sem tipo
                            for(var p=0, len = procRefsSplit.length; p<len; p++)
                            {
                                if(procRefsSplit[p]){
                                    classTriples += "\t:temRelProc " + ":c" + procRefsSplit[p] + " ;\n"
                                } 
                            }
                        }  
                        else {
                            var len = procRefsSplit.length -1
                            for(var p=0; p<len; p++)
                            {
                                if(procTiposSplit[p].match(/S[íi]ntese[ ]*\(s[ií]ntetizad[oa]\)/gi)){
                                    classTriples += "\t:eSintetizadoPor " + ":c" + procRefsSplit[p] + " ;\n"
                                } 
                                else if (procTiposSplit[p].match(/S[íi]ntese[ ]*\(sintetiza\)/gi)){
                                    classTriples += "\t:eSinteseDe " + ":c" + procRefsSplit[p] + " ;\n"
                                }
                                else if (procTiposSplit[p].startsWith('Complementar')){
                                    classTriples += "\t:eComplementarDe " + ":c" + procRefsSplit[p] + " ;\n"
                                }
                                else if (procTiposSplit[p].match(/\s*Cruzad/gi)){
                                    classTriples += "\t:eCruzadoCom " + ":c" + procRefsSplit[p] + " ;\n"
                                }
                                else if (procTiposSplit[p].match(/\s*Suplement.?\s*de/)){
                                    classTriples += "\t:eSuplementoDe " + ":c" + procRefsSplit[p] + " ;\n"
                                }
                                else if (procTiposSplit[p].match(/\s*Suplement.?\s*para/)){
                                    classTriples += "\t:eSuplementoPara " + ":c" + procRefsSplit[p] + " ;\n"
                                }
                                else if (procTiposSplit[p].match(/Sucessão[ ]*\(suce/gi)){
                                    classTriples += "\t:eSucessorDe " + ":c" + procRefsSplit[p] + " ;\n"
                                }
                                else if (procTiposSplit[p].match(/\s*Sucessão\s*\(antece/gi)){
                                    classTriples += "\t:eAntecessorDe " + ":c" + procRefsSplit[p] + " ;\n"
                                }
                                else {
                                    classTriples += "\t:temRelProc " + ":c" + procRefsSplit[p] + " ;\n"
                                    console.log('ERROR: ' + classCode + ':: Rel. entre Proc. desconhecida: ' + procTiposSplit[p])
                                    console.log('>>dados: '+ len + " :: " + procRefsSplit[p] + ' :: ' + procTiposSplit[p])
                                }
                            }
                        }  
                    }
    
                    // Relações com a Legislação
                    if (jsonObj['Diplomas jurídico-administrativos REF']) {
                        var legRefs = jsonObj['Diplomas jurídico-administrativos REF']
                        var legRefsSplit = legRefs.replace(/(\r\n|\n|\r)/gm,"").split("#")
                        
                        for(var l in legRefsSplit)
                        {
                            if(legRefsSplit[l]) {
                                var lref = legRefsSplit[l].trim()
                                // Verificação da existência no catálogo legislativo
                                var indice = legCatalog.findIndex(legrec => legrec.id == lref)
                                if(indice != -1)
                                classTriples += "\t:temLegislacao :" + legCatalog[indice].codigo + " ;\n"
                            else
                                console.error( classCode + ";Referência a legislação inexistente no catálogo; [" + lref + "][" + legRefsSplit[l] + "]")
                            }   
                        }
                    }
    
                    // Atributos fixos de todas as classes
                    classTriples += "\t:classeStatus " + "\"A\" ;\n"

                    // Dimensão qualitativa do processo
                    if(jsonObj['Dimensão qualitativa do processo']) {
                        var dimQualProc = jsonObj['Dimensão qualitativa do processo'].trim()
                        if((classe == 3)||(classe == 4))
                            if(dimQualProc.match(/Elevada|Reduzida|Média/i))
                                classTriples += "\t:processoDimQual " + "\"" + dimQualProc + "\" ;\n"
                            else
                                console.log('ERROR: DimQualProc: valor desconhecido: ' + dimQualProc + ' classe: ' + classCode)
                        else
                            console.log('ERROR: DimQualProc: classe não é de nível 3: ' + classCode)        
                    }

                    // Uniformização do processo
                    if(jsonObj['Uniformização do processo']) {
                        var uniformProc = jsonObj['Uniformização do processo'].trim().replace(/(\r\n|\n|\r| )/gm,"")
                        if((classe == 3)||(classe == 4))
                            if(uniformProc.match(/S|N/i))
                                classTriples += "\t:processoUniform " + "\"" + uniformProc + "\" ;\n"
                            else
                                console.log('ERROR: uniformProc: valor desconhecido: ' + uniformProc + ' classe: ' + classCode)
                        else
                            console.log('ERROR: uniformProc: classe não é de nível 3: ' + classCode)        
                    }

                    // Atenção ao último triplo, tem que terminar em .
                    var mydesc = jsonObj['Descrição'].replace(/\"/gm,"\\\"").replace(/(\r\n|\n|\r)/gm,"")
                    classTriples += "\t:descricao " + "\"" + mydesc + "\"" + ".\n"
    
                    fs.appendFile(fout, classTriples , function(err){
                        if(err)
                            console.error(err)
                        //else
                            //console.log("Gerei a classe: " + classCode)
                    })
                }
            }
        })
    .on('done', (error)=> {
        fs.appendFile(fout, '\n### Classes' + classe + ' termina aqui.\n\n' , function(err){
            if(err)
                console.error(err)
            else
                console.log('Classe ' + classe + ': terminei.')
        })
  })
}