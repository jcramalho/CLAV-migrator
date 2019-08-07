exports.migraClasse = function(entCatalog, legCatalog, tipCatalog, classe, listaErros)
{
    const csv = require('csvtojson')
    const fs = require('fs')

    // Processamento do ficheiro de classes ...........................
    const csvFilePath = "../dados/csvs/" + classe + "-utf8.csv"

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
        .on('data', (data) => {
            var classeLida = JSON.parse(data.toString('utf8'))
            var novaClasse = procClasse(classeLida, listaErros, entCatalog, legCatalog, tipCatalog)
            console.log('Classe ' + novaClasse.codigo + ': terminei.')
            console.log(JSON.stringify(novaClasse))
        })
    .on('done', (error) => {
        if(error){
            console.log('Ocorreu um erro: ' + error)
        }
        else{
            console.log('That\'s all folks!')
        } 
    })
}

function procClasse(c, listaErros, entCatalog, legCatalog, tipCatalog){
    // Estrutura de dados a ser preenchida
    var classe = {
        // Metainformação e campos da área de Descrição
        nivel: 0,
        pai: {
          codigo: "",
          titulo: ""
        },
        codigo: "",
        titulo: "",
        descricao: "",
        notasAp: [],
        exemplosNotasAp: [],
        notasEx: [],
        termosInd: [],
  
        // Campos da área do Contexto de Avaliação
        // Tipo de processo
        tipoProc: "PC",
        procTrans: "N",
  
        // Donos do processo: lista de entidades
        donos: [],
  
        // Participantes no processo: lista de entidades
        participantes: [],
  
        // Processos Relacionados
        processosRelacionados: [],
  
        // Legislação Associada
        legislacao: [],
  
        // Bloco de decisão de avaliação: PCA e DF
        pca: {
          valor: 0,
          formaContagem: "",
          subFormaContagem: "",
          justificacao: [] // j = [criterio]
        }, // criterio = {tipo, notas, [proc], [leg]}
  
        df: {
          valor: "NE",
          notas: "",
          justificacao: []
        }
    }

    if ((c['Estado'].trim()=='') && c['Código']) { // Se é uma linha com info de classe
        var cod = "" + c['Código'].replace(/(\r\n|\n|\r)/gm,"")
        var nivel = calcNivel(cod)
        if(nivel > 0){
            // Informação de identificação e descrição
            classe.nivel = nivel
            classe.codigo = 'c' + cod
            classe.titulo = c['Título'].replace(/(\r\n|\n|\r)/gm,"")
            if(classe.nivel > 1){
                var sep = cod.lastIndexOf(".")
                classe.pai.codigo = 'c' + cod.slice(0,sep)
            }

            listaErros[classe.codigo] = []
            
            // tratamento das notas
            classe.notasAp = migraNA(classe.codigo, c)
            classe.exemplosNotasAp = migraExNA(classe.codigo, c)
            classe.notasEx = migraNE(classe.codigo, c)

            // os termos de índice são migrados à parte

            // Informação de contexto
            if(classe.nivel == 3){
                // Tipo de processo e transversalidade: PC, PE 
                classe.tipoProc = migraTipoProc(classe.codigo, c, listaErros[classe.codigo])
                classe.procTrans = migraProcTrans(classe.codigo, c, listaErros[classe.codigo])

                // Donos
                classe.donos = migraDonos(classe.codigo, c, listaErros[classe.codigo], entCatalog, tipCatalog)
            
                // Participantes
                classe.participantes = migraParticipantes(classe.codigo, c, listaErros[classe.codigo], entCatalog, tipCatalog)

                // Processos Relacionados
                classe.processosRelacionados = migraProcessosRelacionados(c, listaErros[classe.codigo])

                // Legislação
                classe.legislacao = migraLegislacao(classe.codigo, c, listaErros[classe.codigo], legCatalog)
            }

            // Informação sobre as decisões na avaliação
            if(classe.nivel > 2){
                
            }
        }
    }
    return classe
}

// Legislação
function migraLegislacao(classCode, data, listaErrosClasse, legCatalog){
    var res = []
    if (data['Diplomas jurídico-administrativos REF']) {
        var legRefs = data['Diplomas jurídico-administrativos REF']
        var legRefsSplit = legRefs.replace(/(\r\n|\n|\r)/gm,"").split("#")
        
        for(var l in legRefsSplit)
        {
            if(legRefsSplit[l]) {
                var lref = legRefsSplit[l].trim()
                // Verificação da existência no catálogo legislativo
                var indice = legCatalog.findIndex(legrec => legrec.id == lref)
                if(indice != -1){
                    res.push(legCatalog[indice])
                }
                else{
                    listaErrosClasse.push('Referência a legislação inexistente no catálogo: ' + legRefsSplit[l] )
                }
            }   
        }
    }
    return res
}

// Processos Relacionados
function migraProcessosRelacionados(data, listaErrosClasse){
    var res = []
    // Relações com os outros Processos
    if(data['Código do processo relacionado']){
        var procRefs = data['Código do processo relacionado']
        var procRefsSplit = procRefs.replace(/(\r\n|\n|\r|\s)/gm,"").split("#")
        var procTipos = data['Tipo de relação entre processos']
        var procTiposSplit = procTipos.replace(/(\r\n|\n|\r)/gm,"").split("#")

        if(procRefsSplit.length != procTiposSplit.length) {
            listaErrosClasse.push('Tem ' + procRefsSplit.length + " processos relacionados mas " + procTiposSplit.length + 
                                    " tipos de relação. Estas relações não serão migradas." )
        }  
        else {
            var tipoRel = ""
            var len = procRefsSplit.length -1
            for(var p=0; p<len; p++)
            {
                tipoRel = ""
                if(procTiposSplit[p].match(/S[íi]ntese[ ]*\(s[ií]ntetizad[oa]\)/gi)){
                    tipoRel = "eSintetizadoPor"
                } 
                else if (procTiposSplit[p].match(/S[íi]ntese[ ]*\(sintetiza\)/gi)){
                    tipoRel = "eSinteseDe"
                }
                else if (procTiposSplit[p].startsWith('Complementar')){
                    tipoRel = "eComplementarDe"
                }
                else if (procTiposSplit[p].match(/\s*Cruzad/gi)){
                    tipoRel = "eCruzadoCom"
                }
                else if (procTiposSplit[p].match(/\s*Suplement.?\s*de/)){
                    tipoRel = "eSuplementoDe"
                }
                else if (procTiposSplit[p].match(/\s*Suplement.?\s*para/)){
                    tipoRel = "eSuplementoPara"
                }
                else if (procTiposSplit[p].match(/Sucessão[ ]*\(suce/gi)){
                    tipoRel = "eSucessorDe"
                }
                else if (procTiposSplit[p].match(/\s*Sucessão\s*\(antece/gi)){
                    tipoRel = "eAntecessorDe"
                }
                else {
                    listaErrosClasse.push('Relação entre Processos desconhecida: ' + procTiposSplit[p] )
                }
                if(tipoRel != ""){
                    res.push({tipoRel: tipoRel, id: procRefsSplit[p]})
                }
            }
        }  
    }
    return res
}

// Donos
function migraDonos(classCode, data, listaErrosClasse, entCatalog, tipCatalog){
    // Dono(s) do processo
    var res = []
    if (data['Dono do processo']) {
        var excel = data['Dono do processo']
        var donos = excel.replace(/(\r\n|\n|\r)/gm,"").replace(/\.| |,/gm,"_").split("#")

        for(var d=0, len = donos.length; d<len; d++)
        {
            if(donos[d]){
                // Verificação da existência no catálogo organizativo
                if(entCatalog.indexOf(donos[d])!= -1){
                    res.push({id: "ent_" + donos[d], tipo: "Entidade"})
                }
                else if(tipCatalog.indexOf(donos[d])!= -1){
                    res.push({id: "tip_" + donos[d], tipo: "Tipologia"})
                }  
                else{
                    listaErrosClasse.push('Entidade ou Tipologia ' + donos[d] + ' não está no catálogo.')
                }
            }
        }
    } 
    else {
        listaErrosClasse.push('Processo sem donos.')
    }
    return res
}

// Participantes
function migraParticipantes(classCode, data, listaErrosClasse, entCatalog, tipCatalog){
    var res = []
    if(data['Processo transversal (S/N)'] == 'S'){
        if (data['Participante no processo']) {
            var excel = data['Participante no processo']
            var parts = excel.replace(/(\r\n|\n|\r)/gm,"").replace(/\.| |,/gm,"_").split("#")
            var excelTipo = data['Tipo de intervenção do participante']
            var tipos = excelTipo.replace(/(\r\n|\n|\r)/gm,"").split("#")

            var interv = ""

            for(var p=0, len = parts.length; p<len; p++){
                if(parts[p]){
                    // Verificação da existência no catálogo de entidades
                    if(entCatalog.indexOf(parts[p])!= -1){
                    // tipo de participação
                        if (tipos[p]) {
                            switch (tipos[p]) {
                                case 'Apreciar':
                                    interv = "Apreciar"
                                    break;
                                case 'Assessorar':
                                    interv = "Assessorar"
                                    break
                                case 'Comunicar':
                                    interv = "Comunicar"
                                    break
                                case 'Decidir':
                                    interv = "Decidir"
                                    break
                                case 'Executar':
                                    interv = "Executar"
                                    break
                                case 'Iniciar':
                                    interv = "Iniciar"
                                    break
                                default:
                                    listaErrosClasse.push('Entidade ' + parts[p] + ' tem intervenção mal definida.')
                                    break;
                            }
                            res.push({ id: "ent_" + parts[p], tipo: "Entidade", intervencao: interv})
                        } 
                        else {
                            listaErrosClasse.push('Entidade ' + parts[p] + ' não tem intervenção definida.')
                        }
                    }
                    else if(tipCatalog.indexOf(parts[p])!= -1){
                    // tipo de participação
                        if (tipos[p]) {
                            switch (tipos[p]) {
                                case 'Apreciar':
                                    interv = "Apreciar"
                                    break;
                                case 'Assessorar':
                                    interv = "Assessorar"
                                    break
                                case 'Comunicar':
                                    interv = "Comunicar"
                                    break
                                case 'Decidir':
                                    interv = "Decidir"
                                    break
                                case 'Executar':
                                    interv = "Executar"
                                    break
                                case 'Iniciar':
                                    interv = "Iniciar"
                                    break
                                default:
                                    listaErrosClasse.push('Tipologia ' + parts[p] + ' tem intervenção mal definida.')
                                    break;
                            }
                            res.push({ id: "tip_" + parts[p], tipo: "Tipologia", intervencao: interv})
                        } 
                        else {
                            listaErrosClasse.push('Tipologia ' + parts[p] + ' não tem intervenção definida.')
                        }
                    }
                    else
                        listaErrosClasse.push('Entidade ou Tipologia ' + parts[p] + ' não está no catálogo.')
                }
            }   
        } else {
            listaErrosClasse.push('Processo sem participantes.')
        }
    }
    return res
}

// Transversalidade
function migraProcTrans(classCode, data, listaErrosClasse){
    // Transversal: S/N
    var res = ""
    if (data['Processo transversal (S/N)']) {
        res = data['Processo transversal (S/N)']
    } else {
        listaErrosClasse.push('Transversalidade vazia.')
    }
    return res
}

function calcNivel(cod)
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

// --------------------------------------------------------------------------
// NOTAS DE APLICAÇÃO
// --------------------------------------------------------------------------
function migraNA(classCode, data)
{
    const nanoid = require('nanoid')
    var notas = []
    var naList = []
    // tratamento das notas de aplicação
    if (data['Notas de aplicação'] && (data['Notas de aplicação'] != "")) {
        var textoNA = data['Notas de aplicação']
        naList = textoNA.replace(/(\r\n|\n|\r)/gm,"").split("#")
                  
        for(var na=0; na < naList.length; na++){
            if(naList[na]){
                // criar as instâncias das notas de aplicação
                var idNota = "na_" + classCode + "_"  + nanoid()
                var naLimpa = naList[na].replace(/\"/g,"\\\"")
                notas.push({
                    id: idNota,
                    nota: naLimpa
                })
            }
        }
    }
    return notas
}

// --------------------------------------------------------------------------
// EXEMPLOS DE NOTAS DE APLICAÇÃO
// --------------------------------------------------------------------------
function migraExNA(classCode, data)
{
    const nanoid = require('nanoid')
    var exemplos = []
    var exNAList = []

    if (data['Exemplos de NA']) {
        var textoExNA = data['Exemplos de NA']
        exNAList = textoExNA.replace(/(\r\n|\n|\r)/gm,"").split("#")
       
            for(var exna=0, len = exNAList.length; exna<len; exna++){
                if(exNAList[exna]){
                    // criar as instâncias para os exemplos das notas de aplicação
                    var exnaCode = "exna_" + classCode + "_" + nanoid()
                    exemplos.push({
                        id: exnaCode,
                        exemplo: exNAList[exna]
                    })
                }
            }
        }
    return exemplos
}

// ------------------------------------------------------------------------------------
// NOTAS DE EXCLUSÃO
// --------------------------------------------------------------------------
function migraNE(classCode, data)
{
    const nanoid = require('nanoid')
    var notas = []
    var neList = []
    if (data['Notas de exclusão']) {
        var textoNE = data['Notas de exclusão']
        neList = textoNE.replace(/(\r\n|\n|\r)/gm,"").split("#")
                    
        for(var ne=0, len = neList.length; ne<len; ne++){
            if(neList[ne]){
                // criar as instâncias das notas de exclusão
                var neCode = "ne_" + classCode + "_" + nanoid()
                var neLimpa = neList[ne].replace(/\"/g,"\\\"")
                notas.push({
                    id: neCode,
                    nota: neLimpa
                })
            }
        
        }
    }
    return notas
}

// ------------------------------------------------------------------------------------
// TIPO DE PROCESSO
// --------------------------------------------------------------------------
function migraTipoProc(classCode, data, listaErrosClasse){
    var res = ""
    if (data['Tipo de processo']) {
        res = data['Tipo de processo'].trim()
        if((res != "PC") && (res != "PE")){
            listaErrosClasse.push('ERRO: tipo de processo desconhecido: ' + res)
        }       
    }
    else {
        listaErrosClasse.push('Tipo de processo vazio.')
    }
    return res
}