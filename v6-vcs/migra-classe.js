const csv = require('csvtojson')
const fs = require('fs')
require("console-sync")

// Carregamento das organizações para verificação
var jfile = require("jsonfile")
var file = "../dados/json/org.json"

jfile.readFile(file, function(err, orgCatalog) {
    if(err)
        console.log(err)
    else{
        // Carregamento da legislação para verificação
        var file = "../dados/json/leg.json"
        jfile.readFile(file, function(err, legCatalog){
            if(err)
                console.log(err)
            else{
                var file = "../dados/json/tipologia.json"
                jfile.readFile(file, function(err, tipologiaCatalog){
                    if(err)
                        console.log(err) 
                    else
                        {
                            var classe = require("./mod-classe.js")
                            if (process.argv.length < 3){
                                console.log('Atenção: não especificou a classe a migrar')
                            }
                            else{
                                classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, process.argv[2])
                            }
                        }
                })
            }
        })
    }
  })