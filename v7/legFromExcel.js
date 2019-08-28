var Excel = require('exceljs')
const fs = require('fs')
const nanoid = require('nanoid')

var filename = "../dados/excel/Frecolha-20190826.xlsx"
var workbook = new Excel.Workbook();
workbook.xlsx.readFile(filename)
  .then(function(wb) {
    // Tratamento da Legislação
    // Os documentos legislativos vão ser carregados num array para validações posteriores
    var legCatalog = []
    // Ficheiro de saída
    var fout = '../dados/ontologia/leg.ttl'
    // Leitura da Legislação da FRD
    var worksheet = wb.getWorksheet('leg.csv');

    // Header
    fs.writeFileSync(fout, '### Legislação\n')
    console.log('Legislação: Comecei a processar');
    // Null;Tipo(1);Entidade(2);Número(3);Data(4);Sumário(5);Link(6);   

    worksheet.eachRow(function(row, rowNumber) {
      /*console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
      row.eachCell(function(cell, colNumber) {
        console.log('Cell ' + colNumber + ' = ' + cell.text);
      });*/
      
      if(rowNumber > 1){
        var tipo = row.getCell(1).text
        var entidade = row.getCell(2).text
        var numero = row.getCell(3).text
        var dataVal = new Date(row.getCell(4).text)
        var data = dataVal.toISOString().split('T')[0]
        var sumario = row.getCell(5).text
        var link = row.getCell(6).text

        var lcode = tipo.trim()
        
        if(entidade) lcode += " " + entidade.replace(/(\r\n|\n|\r| )/gm,"")

        if(entidade){
          var entidades = entidade.replace(/(\r\n|\n|\r| )/gm,"").split(/;|,/)
          for(var i in entidades){
            lcode += " " + entidades[i]
          }
      }
        
        if(numero) lcode += " " + numero
        var mycode = "leg_" + nanoid()

        if(legCatalog.indexOf(lcode) === -1){
          var legrec = {codigo: mycode, id: lcode}
          legCatalog.push(legrec)

          var mytit = sumario.replace(/\"/gm,"\\\"").replace(/(\r\n|\n|\r)/gm,"")
          
          var currentStatements = "###  http://jcr.di.uminho.pt/m51-clav#" + mycode + ' - FRD(' + rowNumber + ')\n'
          currentStatements += ":" + mycode + " rdf:type owl:NamedIndividual ,\n"
          currentStatements += "\t:Legislacao ;\n"
          currentStatements += "\t:rdfs:label \"Leg.: " + lcode + "\";\n"
          currentStatements += "\t:diplomaTipo " + "\"" + tipo + "\";\n"

          if(entidade){
              var entidades = entidade.replace(/(\r\n|\n|\r| )/gm,"").split(/;|,/)
              for(var i in entidades){
                  currentStatements += "\t:temEntidadeResponsavel " + ":ent_" + entidades[i] + ";\n"
              }
          }
          
          currentStatements += "\t:diplomaNumero " + "\"" + numero + "\";\n"
          currentStatements += "\t:diplomaData " + "\"" + data + "\";\n"
          currentStatements += "\t:diplomaSumario " + "\"" + mytit + "\";\n"
          currentStatements += "\t:diplomaEstado " + "\"Ativo\";\n"

          // Atenção ao último triplo, tem que terminar em .
          currentStatements += "\t:diplomaLink " + "\"" + link + "\".\n"

          // console.log(currentStatements)
          fs.appendFileSync(fout, currentStatements)
        }                   
        else{
          console.error("ERRO: Duplicação de id na legislação [" + mycode + "]  " + legCatalog.indexOf(lcode) + "/" + legCatalog.length + "::" + lcode )
        }  
      }
    }) //worksheet.eachRow
    console.log('Legislação: terminei.');
    fs.writeFileSync("../dados/json/leg.json", JSON.stringify(legCatalog, null, 2))
    fs.appendFileSync(fout, '\n### Legislação termina aqui.\n\n')
  });


  
     
