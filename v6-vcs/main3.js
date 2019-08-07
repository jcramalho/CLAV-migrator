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
                            // Migradores modulares
                            var ti = require("./mod-ti2.js")
                            var classe = require("./mod-classe.js")

                            // ------------------ Controlador principal ----------------------------------

                            ti.migraTI()
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '100')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '150')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '200')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '250')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '300')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '350')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '400')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '450')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '500')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '550')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '600')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '650')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '700')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '710')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '750')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '800')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '850')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '900')
                            classe.migraClasse(orgCatalog, legCatalog, tipologiaCatalog, '950')
                        }
                })
                // ------------------ Fim do Controlador principal ----------------------------------            
            }
        })
    }
  })









