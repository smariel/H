/*
 *  Version 2.6
 *  	Séparation des semaines dans l'historique
 *  Version 2.5
 *  	Modification de la donnée "jour" stockée à chaque élément de l'historique
 *  	Modif de l'affichage du jour, rajout d'une classe week_XX à chaque élément
 *  Version 2.4
 *  	Modification des fonctions d'import et export
 *  	Export de l'histo dans un objet JSON au format texte dans un fichier.txt
 *  	Import d'un fichier.txt contenant une objet JSON historique
 *  Version 2.3
 *  	Ajout de la fonction d'import d'un objet JSON au format texte
 *  	Modification de l'affichage de la date pour compatibilité Chrome
 *  Version 2.2
 *  	Correction bug : récup du dernier élément de l'historique
 *  	Ajout de tous les commentaires du code JS
 *	Version 2.1
 *		ajout du bouton d'export d'un objet JSON au format texte
 *		Auto-complete des champs : récupération du dernier élément de l'historique au chargement
 *
 */



// constantes et configurations

const $localStorage_historyName	= "h_history";
const $h_normal					= {	'str':'7h33',
									'm':33,
									'h':7, 
									'total':453};
const $selector_in_arrive		= "#in_hArrive";
const $selector_in_todo			= "#in_hToDo";
const $selector_in_midi			= "#in_chkMidi";
const $selector_in_custom		= "#in_hCustom";
const $selector_in_btAddHisto	= "#bt_addHisto";
const $selector_out_h733		= "#out_h733";
const $selector_out_h0			= "#out_h0";
const $selector_out_cred733		= "#out_cred733";
const $selector_out_credCustom	= "#out_credCustom";
const $selector_edit_index		= "#edit_index";
const $selector_edit_date		= "#edit_date";
const $selector_edit_hArrive	= "#edit_hArrive";
const $selector_edit_hTodo		= "#edit_hToDo";
const $selector_edit_sortieCalc	= "#edit_sortieCalc";


const $selectors_allOutputs		= {	0:$selector_out_h733,
									1:$selector_out_h0,
									2:$selector_out_cred733,
									3:$selector_out_credCustom};

const $jours_semaine			= {	0: 'Dimanche',
									1: 'Lundi',
									2: 'Mardi',
									3: 'Mercredi',
									4: 'Jeudi',
									5: 'Vendredi',
									6: 'Samedi'};

const $mois_annee				= {	0 : 'Janvier',
									1 : 'Février',
									2 : 'Mars',
									3 : 'Avril',
									4 : 'Mai',
									5 : 'Juin',
									6 : 'Juillet',
									7 : 'Août',
									8 : 'Septembre',
									9 : 'Octobre',
									10: 'Novembre',
									11: 'Décembre'};

const $today_glob 					= new Date();


// DOM chargé
$(document).ready(function(){
	
	// --------------------------------------------------------------------------------------------
	// Exécutions au lancement de la page
	// --------------------------------------------------------------------------------------------
	
	
	// Check de la compatibilité avec HTML5 et Web Storage
	if (!localStorage) {
		$("body").prepend('<div style="margin:20px" class="alert alert-error">Ce navigateur ne supporte pas le HTML Web Storage</div>');
	}
	
	// Masquage du bloc d'alerte des mauvaises syntaxe
	$("#bad_hours").hide();
	
	// Update des champs avec le dernier élément de l'historique
	var $lastItem = getLastHistoryItem();
	$($selector_in_arrive).attr("value",$lastItem.h_arrive.str);
	$($selector_in_todo).attr("value",$lastItem.h_afaire.str);
	
	// Mise à jour des éléments d'interface
	updateResults();
	updateHistoryHTML();
	
	
	
	// --------------------------------------------------------------------------------------------
	// Evenements à tous moments
	// --------------------------------------------------------------------------------------------
	
	
	// Changement sur input => MaJ immédiate des résultats
	$("input, select").change(function(){ 
		updateResults(); 
	}).keyup(function(){
		updateResults();
	});
	
	
	// Click sur bouton "Ajouter" => ajout des données rentrées dans l'historique
	$($selector_in_btAddHisto).live('click',function(){
		if(!checkAll()) return;	// check des syntaxe des inputs
		
		// récup des valeurs des inputs
		var $h1	= hstr2object($($selector_in_arrive).val());
		var $h2	= hstr2object($($selector_in_todo).val());
		
		// récup de la date du jour (constante globale $today_glob)
		var $d_str = $today_glob.getFullYear() + '-' + (($today_glob.getMonth() < 9) ? "0" : "")+($today_glob.getMonth()+1) + '-' + (($today_glob.getDate() < 10) ? "0" : "")+$today_glob.getDate();
		var $j = {'date':$today_glob, 'str':$d_str};
		
		// création de l'objet final à sauvegarder
		var $data ={"h_arrive":$h1,
					"h_afaire":$h2,
					"jour":$j,
					"calcSortie":true };
		
		// envoi de l'objet créé vers l'historique Local Storage, retour du nouvel index
		var $new_elt = createHistoryItem($data);
		console.debug('Ajout de '+$new_elt);
		
		// mise à jour du bloc HTML historique
		updateHistoryHTML();
	});
	
	
	// Click sur bouton de suppression d'un élément de l'historique
	$(".bt_del").live('click',function(){
		$indexToDelete = $(this).parent().parent().attr("id").match(/[0-9]+$/);	// récupération de l'index de l'élément dans l'historique
		deleteHistoryItem($indexToDelete);										// suppression de l'élément
		
		console.debug("Suppression de "+$indexToDelete);
		updateHistoryHTML();
	});
	
	
	// Click sur bouton modification => ouverture de la fenêtre modale
	$(".editHistoModal_bt").live('click',function(){
		var $indexToUpdate = $(this).parent().parent().attr("id").match(/[0-9]*$/);	// récupération de l'index
		var $itemToUpdate = readHistoryItem($indexToUpdate);						// récupération de l'élément à l'index

		// init des champs du formulaire d'édition
		$($selector_edit_index	).attr("value", $indexToUpdate);
		$($selector_edit_date	).attr("value", $itemToUpdate.jour.str);
		$($selector_edit_hArrive).attr("value", $itemToUpdate.h_arrive.str);
		$($selector_edit_hTodo	).attr("value", $itemToUpdate.h_afaire.str);
		if($itemToUpdate.calcSortie) $($selector_edit_sortieCalc).attr("checked","checked");
	});
	
	
	// Click sur bouton de validation de la modification
	$('#edit_validBT').live("click",function(){
		var $indexToUpdate = $($selector_edit_index	).attr("value");	// récup de l'index de l'émlément à modifier
		var $itemToUpdate = readHistoryItem($indexToUpdate);			// récup de l'élément à l'index
		
		// Mise à jour des valeurs de l'objet par celles du formulaires
		$itemToUpdate.h_arrive = hstr2object($($selector_edit_hArrive).attr("value"));
		$itemToUpdate.h_afaire = hstr2object($($selector_edit_hTodo).attr("value"));
		$itemToUpdate.jour.str = $($selector_edit_date).attr("value");
		$itemToUpdate.jour.date = new Date($itemToUpdate.jour.str);
		$itemToUpdate.calcSortie = $($selector_edit_sortieCalc).is(":checked");
		
		updateHistoryItem($indexToUpdate, $itemToUpdate);	// mise à jour de l'objet stocké
		
		// fermeture de la fenêtre modale et MaJ du HTML de l'historique
		$("#editHistoModal").modal('hide');	
		updateHistoryHTML();
	});	
	
	
	// Click sur bouton d'export de l'historique
	$('#export_bt').live("click",function(){
		// création du nom du fichier
		var fileName = "H_History_"+$today_glob.getFullYear()+"-"+($today_glob.getMonth()+1)+"-"+$today_glob.getDate();
		var fileData = new Blob([JSON.stringify(getHistory())],{type: 'text/plain'});	// création d'un blob contenant les infos
		saveAs(fileData,fileName);	// téléchargement du fichier
	});
	
	
	// click sur le bouton d'importation (affiche la fenêtre modale)
	$('#import_bt').live("click",function(){
		$("#importHistoModal").modal('show');	
	});
	
	
	//  valide l'importation de l'historique
	$('#import_validBT').live("click",function(){
		// API File
		// http://www.w3.org/TR/FileAPI/#dfn-filereader
		
		$("#importHistoModal").modal('hide');	
		
		var $data2import = null;									// préparation de la donnée
		var $fileInput = document.querySelector('#data2import');	// récup input file
		var $reader = new FileReader();								// création de l'objet qui liera le fichier
		
		$reader.readAsText($fileInput.files[0]);					// lecture du fichier
		$reader.onload = function() {								// quand lecture terminée
			$data2import = $reader.result;							// récup des données
			
			if($data2import == null || $data2import == undefined) {	// si donnée incorrecte
				alert("Valeurs incorrectes");						// on informe et on dégage
				console.debug("Erreur d'import");					
			}
			else {
				setHistory(JSON.parse($data2import));				// import de l'historique à la place de l'ancien
				console.debug("Historique importé");				// on informe
				location.reload();									// on recharge la page. Un updateResults() ne suffit pas, à voir pourquoi
			}
		};
	});
	
	
	
	// --------------------------------------------------------------------------------------------
	// Fonctions Calcul Heures
	// --------------------------------------------------------------------------------------------
	
	
	// met à jour les champs de résultat
	// *********************************
	function updateResults()
	{
		// si les inputs n'ont pas la bonne syntaxe, on prévient
		if(!checkAll())
		{
			const $init_txt = "--h--";
			setOutputs({0:$init_txt, 1:$init_txt, 2:$init_txt, 3:$init_txt}, $selectors_allOutputs, 'important');
			$("#bad_hours").fadeIn("fast");
			return;
			
		}
		
		$("#bad_hours").fadeOut("fast");
		
		// recup des valeurs du form
		var $h_arrive	= hstr2object($($selector_in_arrive).val());			// récup heure d'arrivée
		var $h_todo		= hstr2object($($selector_in_todo).val());				// récup heures à faire
		var $midi 		= ($($selector_in_midi+":checked").length) ? 45 : 0;	// récup comptage du midi
		var $h_custom	= $($selector_in_custom).val();							// récup de l'heure de sortie souhaitée
		
		// calculs
		var $h_733			= minutes2object($h_arrive.total + $h_normal.total + $midi);	// calcul de l'heure de sortie pour une journée de 7h33
		var $h_0			= minutes2object($h_arrive.total + $h_todo.total + $midi);		// calcul de l'heure de sortie pour 0 cred
		var $cred_733		= minutes2object($h_733.total - $h_0.total);					// calcul crédit d'heure journée de 7h45
		var $cred_custom	= minutes2object($h_custom - $h_0.total);						// calcul du credit à l'heure de sortie sélectionnée
		
		// affichage
		setOutputs({0:$h_733.str,
					1:$h_0.str,
					2:$cred_733.str,
					3:$cred_custom.str},$selectors_allOutputs,'info');
		
		console.debug('Résultats mis à jour');
	}
	
	
	// vérifie la syntaxe de la "chaine heure" passée en paramètre
	// ***********************************************************
	function checkSyntax($par_theHour)
	{
		if ($par_theHour.match(/^[0-9]+.{1}[0-5][0-9]$/) == null ) return false;
		else return true;	
	}
	
	
	// vérifie la syntaxe de tous les inputs d'heures
	// **********************************************
	function checkAll()
	{
		// récup des #id des inputs à vérifier
		var $inputs2check = Array($selector_in_arrive, $selector_in_todo);
		var $no_errors = true;
		
		// pour chaque inpit
		for (var $input in $inputs2check)
		{
			var $selector = $inputs2check[$input];
			// si la syntaxe n'est pas bonne, on ajoute une classe CSS "error" à l'élément
			if (!checkSyntax($($selector).val()))
			{
				$($selector).parent().parent().parent().addClass("error");
				$no_errors = false;
			}
			// si la syntaxe est correcte, on enlève la classe CSS "error"
			else $($selector).parent().parent().parent().removeClass("error");
		}
		
		return $no_errors;
	}
	
	
	// converti une "chaine heure" en objet "JSON heure"
	// *************************************************
	function hstr2object($par_heure) {
		// séparation des heures et des minutes de la chaine
		var $h = parseInt($par_heure.match(/^[0-9]+/g),10);
		var $m = parseInt($par_heure.match(/[0-9]+$/g),10);
		
		return {'str':$par_heure, 
				'h':$h, 
				'm':$m, 
				'total':($h*60+$m),
				'signe':""};
	}
	
	// converti un temps en minute en objet "JSON heure"
	// *************************************************
	function minutes2object($par_total) 
	{
		var $signe = "";
		var $total = $par_total;
		
		// si le total est négatif
		if( $total < 0 ) {
			$total = 0 - $total;	// on le passe en positif
			$signe = "-";			// on indique un signe "moins" dans la var$signe
		}
		
		var m = $total % 60;		// calcul des minutes "--hXX"
		var h = ($total - m)/60;	// calcul des heures  "XXh--"
		if (m<10) m = '0' + m;		// si les minutes sont < 10, on ajoute un "0" en texte
		
		return {'str':$signe+h+'h'+m,
				'm':m,
				'h':h, 
				'total':$par_total,
				'signe':$signe};
	}
	
	
	// inscrit les données en sorties
	// ******************************
	function setOutputs($par_data,$par_outputs_selectors,$par_label) 
	{
		// Les données "$par_data" sont les contenus des éléments "$par_outputs_selectors"
		
		// pour chaque donnée
		for (var i in $par_data)
		{	
			$($par_outputs_selectors[i]).text($par_data[i]);					// inscription de la donnée
			$($par_outputs_selectors[i]).removeClass();							// remove de toutes les classe CSS
			$($par_outputs_selectors[i]).addClass("label label-"+$par_label);	// ajout des classe label adéquates
		}
	}
	
	
	
	
	
	
	
	// --------------------------------------------------------------------------------------------
	// Fonctions Historique
	// --------------------------------------------------------------------------------------------
	
	
	// Set et Get de l'historique en HTML5 Web Storage (localStorage)
	// **************************************************************
	function setHistory($par_theHistory) { localStorage.setItem($localStorage_historyName,JSON.stringify($par_theHistory)); }
	function getHistory() 
	{
		var $data = JSON.parse(localStorage.getItem($localStorage_historyName));
		if($data == null || $data == undefined || $data == "") {
			console.debug("L'objet Historique n'existe pas en Local Storage");
			setHistory({});
			$data = getHistory();
		}
		return $data; 
	}
	
	// Create
	// ******
	function createHistoryItem($par_data) 
	{
		$the_history 		= getHistory();					// récup de l'historique
		$the_history_array	= Object.keys($the_history);	// tableau énuméré des index de l'historique
		$nbElt_history 		= $the_history_array.length;	// nombre d'élément de l'historique (nombre d'index)
		
		// Création du nouvel index en fonction du nombre d'élément déjà présents
		if ($nbElt_history > 0)	var $new_index = parseInt($the_history_array[$nbElt_history - 1]) + 1;
		else					var $new_index = 1;
		
		$the_history[$new_index] = $par_data;	// insertion des données au nouvel index
		setHistory($the_history);				// mise à jour en Local Storage
		
		return $new_index;	// retour du nouvel index
	}
	
	// Read
	// ****
	function readHistoryItem($par_index)
	{
		$the_history = getHistory();		// récupération de l'historique complet
		return $the_history[$par_index];	// retour de l'objet à l'index demandé
	}
	
	// Update
	// ******
	function updateHistoryItem($par_index, $par_item)
	{
		$the_history = getHistory();			// récupération de l'historique complet
		$the_history[$par_index] = $par_item;	// insertion des nouvelles valeurs à l'index indiqué
		setHistory($the_history);				// mise à jour en Local Storage
	}
	
	// Delete
	// ******
	function deleteHistoryItem($par_index)
	{
		$the_history = getHistory();		// récupération de l'historique complet 
		delete $the_history[$par_index];	// suppression de l'élément indiqué
		setHistory($the_history);			// mise à jour en Local Storage
	}
	
	
	// Retour du dernier élément de l'historique 
	// *****************************************
	function getLastHistoryItem()
	{
		var $the_history 		= getHistory();					// récup de l'historique sous forme objet (clé:valeur)
		var $the_historyArray	= Object.keys($the_history);	// transformation de l'objet en tableau énuméré de clés
		var $nbElt_history		= $the_historyArray.length;		// récup du nombre de clés
		
		if ($nbElt_history <= 0)
			return {"h_arrive":"", "h_afaire":"", "jour":"", "calcSortie":false}; // objet vide au format heure
		else
			return $the_history[$the_historyArray[$nbElt_history - 1]];	// dernier élément = objet[derniereClé] = objet[tabClé[indexDerniereClé]]
	}
	
	
	// Mise à jour du bloc HTML de l'historique
	// ****************************************
	function updateHistoryHTML()
	{
		$the_history = getHistory();					// récup de l'historique
		$the_history_array = Object.keys($the_history);	// tableau énuméré des index de l'historique
		
		// vidage de l'historique et initialisation des variables
		$("#historique table tbody").empty();
		var $theItem;
		var $nextItem;
		var $sortie;
		var $credit;
		
		// pour chaque index
		for (var i in $the_history_array)
		{
			$theItem_index = $the_history_array[i];		// l'index
			$theItem = $the_history[$theItem_index];	// la valeur associé à l'index
			
			$nextItem_index = $the_history_array[parseInt(i)+1];	// calcul l'index suivant
			$nextItem = $the_history[$nextItem_index];				// recup de la valeur associé à l'index suivant (undefined si elle n'existe pas)
			
			// si l'élément suivant existe ET qu'on demande de calculer l'heure de sortie
			if($nextItem != undefined && $theItem.calcSortie == true ){
				$sortie = minutes2object($theItem.h_arrive.total + $theItem.h_afaire.total + 45 + $h_normal.total - $nextItem.h_afaire.total);
				$credit = minutes2object(($sortie.total - $theItem.h_arrive.total) - ($h_normal.total + 45));
				
				$sortie = $sortie.str;
				$credit = $credit.str;
				
			}
			else // sinon, cases vides
			{
				$sortie = "";
				$credit = "";
			}
			
			// récup du jour et création d'un objet Date() plus complet
			$theDay  = new Date($theItem.jour.date);
			$theDay_disp = $jours_semaine[$theDay.getDay()] + " " + $theDay.getDate() + " " + $mois_annee[$theDay.getMonth()];
			
			// affichage de la ligne du tableau remplie
			$("#historique table tbody").append('<tr id="history_'+$theItem_index+'">'+
												'	<td>'+$theDay_disp+'</td>'+
												'	<td>'+$theItem.h_arrive.str+'</td>'+
												'	<td>'+$sortie+'</td>'+
												'	<td>'+$credit+'</td>'+
												'	<td><a href="#editHistoModal" role="button" class="btn btn-mini editHistoModal_bt" data-toggle="modal">Modifier</a> <button class="bt_del btn btn-mini btn-danger" type="button">Effacer</button></td>'+
												'</tr>');
			
			// séparation si jour prochain fait partie d'une autre semaine
			if($nextItem != undefined) {								// s'il existe un item après celui-ci
				$nextDay = new Date($nextItem.jour.date);				// récup de la date de l'item suivant
				if($theDay.getWeek() != $nextDay.getWeek()) {			// si l'item actuel et l'item suivant ne sont pas à la même semaine
					$('#history_'+$theItem_index).addClass("week_end");	// ajout d'une classe à l'item actuel
				}
				
			}
		}
	}

	
	
	
});




// --------------------------------------------------------------------------------------------
// Autres fonctions
// --------------------------------------------------------------------------------------------


//Calcule le numéro de la semaine
//*******************************
Date.prototype.getWeek = function(){
 // We have to compare against the first monday of the year not the 01/01
 // 60*60*24*1000 = 86400000
 // 'onejan_next_monday_time' reffers to the miliseconds of the next monday after 01/01

 var day_miliseconds = 86400000,
     onejan = new Date(this.getFullYear(),0,1,0,0,0),
     onejan_day = (onejan.getDay()==0) ? 7 : onejan.getDay(),
     days_for_next_monday = (8-onejan_day),
     onejan_next_monday_time = onejan.getTime() + (days_for_next_monday * day_miliseconds),
     // If one jan is not a monday, get the first monday of the year
     first_monday_year_time = (onejan_day>1) ? onejan_next_monday_time : onejan.getTime(),
     this_date = new Date(this.getFullYear(), this.getMonth(),this.getDate(),0,0,0),// This at 00:00:00
     this_time = this_date.getTime(),
     days_from_first_monday = Math.round(((this_time - first_monday_year_time) / day_miliseconds));

 var first_monday_year = new Date(first_monday_year_time);

 // We add 1 to "days_from_first_monday" because if "days_from_first_monday" is *7,
 // then 7/7 = 1, and as we are 7 days from first monday,
 // we should be in week number 2 instead of week number 1 (7/7=1)
 // We consider week number as 52 when "days_from_first_monday" is lower than 0,
 // that means the actual week started before the first monday so that means we are on the firsts
 // days of the year (ex: we are on Friday 01/01, then "days_from_first_monday"=-3,
 // so friday 01/01 is part of week number 52 from past year)
 // "days_from_first_monday<=364" because (364+1)/7 == 52, if we are on day 365, then (365+1)/7 >= 52 (Math.ceil(366/7)=53) and thats wrong

 return (days_from_first_monday>=0 && days_from_first_monday<364) ? Math.ceil((days_from_first_monday+1)/7) : 52;
}