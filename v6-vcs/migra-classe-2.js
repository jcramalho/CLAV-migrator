const csv = require('csvtojson')
const fs = require('fs')
require("console-sync")

// Carregamento das entidades para verificação
var jfile = require("jsonfile")
var file = "../dados/json/ent.json"

jfile.readFile(file, function(err, entCatalog) {
    if(err)
        console.log(err)
    else{
        // Carregamento da legislação para verificação
        var file = "../dados/json/leg.json"
        jfile.readFile(file, function(err, legCatalog){
            if(err)
                console.log(err)
            else{
                var file = "../dados/json/tip.json"
                jfile.readFile(file, function(err, tipCatalog){
                    if(err)
                        console.log(err) 
                    else
                        {
                            var classe = require("./mod-classe-2.js")
                            if (process.argv.length < 3){
                                console.log('Atenção: não especificou a classe a migrar')
                            }
                            else{
                                classe.migraClasse(entCatalog, legCatalog, tipCatalog, process.argv[2])
                            }
                        }
                })
            }
        })
    }
  })