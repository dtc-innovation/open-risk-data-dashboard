/**
 * Created by Manuel on 15/05/2017.
 */

RodiApp.controller('RodiCtrl', ['$scope', 'RodiSrv', '$window', '$filter', '$location','NgTableParams','$timeout', '$q', function ($scope, RodiSrv, $window, $filter, $location,NgTableParams,$timeout,$q) {


    // ************************************** //
    // *************** INIT ***************** //
    // ************************************** //

    // Check server CALL

    $scope.isIE11 = !!window.MSInputMethodContext && !!document.documentMode;

    $scope.bLogin = false;
    $scope.tokenid = localStorage.getItem('rodi_token');
    $scope.userinfo = JSON.parse(localStorage.getItem('rodi_user'));
    $scope.baseURL = baseAPIurl;

    if(!$scope.userinfo)
    {
        $scope.userinfo = RodiSrv.getUserStructureEmpty();
    }

    if($scope.tokenid) {$scope.bLogin = true; } else {$scope.bLogin = false;}

    // Hazard Filters
    $scope.objHazardFilters =
        {
            "filterRiverFlood": "",
            "filterEarthquake": "",
            "filterVolcano": "",
            "filterCyclone": "",
            "filterCoastalFlood": "",
            "filterWaterScarsity": "",
            "filterLandSlide": "",
            "filterTsunami": ""
        };

    $scope.changepage = RodiSrv.changepage;

    // ************************************** //
    // ************ HOME PAGE *************** //
    // ************************************** //
    if ($location.path().indexOf('index') !== -1 || $location.path() === '/')
    {

        $scope.countryWithData = "--";
        $scope.totalDataset = "--";
        $scope.iOpenIndex = "--";


        RodiSrv.getHomeIndicators(function(data)
        {
            //Success API

            $scope.countryWithData = data.data.countries;
            $scope.totalDataset = data.data.datasets_count;
            // $scope.iOpenIndex = data.data.fullscores_count * 1;

            $scope.iOpenIndex = ((data.data.fullscores_count / data.data.datasets_count) * 100).toFixed(1);


        }, function(data)
        {
            // Error
        });


    }

    // ************************************** //
    // *********** STATS PAGE *************** //
    // ************************************** //

    if ($location.path().indexOf('stats.html') !== -1)
    {

        var sLabel = "";
        var sData = "";
        var oItem = {};

        // Category Dataset variables
        $scope.iOpenIndex = 0;
        var iTotalDatasets = 0;
        var aTotDataset = [];
        var aChartData = [];
        $scope.seriesSelected = "";

        // Peril variables
        $scope.iOpenIndexPeril = 0;
        var iTotalDatasetsPeril = 0;
        var aTotDatasetPeril = [];
        var aChartDataPeril = [];
        $scope.seriesSelectedPeril = "";


        // ************************************** //
        // ******* STATISTICS & MAP DATA ******** //
        // ************************************** //

        // GET HOME INDICATORS
        // getHomeIndicators

        RodiSrv.getHomeStatistics(function(data)
        {
            // Statistics index

            $scope.getPelirsIcons = function(code)
            {
                return RodiSrv.getHazardIcon(code);
            }

            $scope.dataCategoryIcon = function(code)
            {
                return RodiSrv.getSingleDataCategoryIcon(code);
            }

            $scope.perilCounters = data.perils_counters;
            $scope.categoryCounters = data.categories_counters;
            $scope.countryWithData = data.countries_count;
            $scope.totalDataset = data.datasets_count;

            $scope.progressCountryVal = ((data.countries_count / 195) * 100).toFixed(0);

            initChartData ('');
            initChartDataPeril('');

            // ************************************** //
            // ************ PIE CHARTS ************** //
            // ************************************** //

            // Make monochrome colors and set them as default for all pies
            Highcharts.getOptions().plotOptions.pie.colors = (function () {
                var colors = [],
                    base = "#FF8000",
                    i;

                for (i = 0; i < 10; i += 1) {
                    // Start out with a darkened base color (negative brighten), and end
                    // up with a much brighter color
                    colors.push(Highcharts.Color(base).brighten((i - 3) / 7).get());
                }
                return colors;
            }());

            Highcharts.chart('datasetCategories', {
                chart: {
                    type: 'pie',
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    options3d: {
                        enabled: false,
                        alpha: 45,
                        beta: 0,
                        depth: 100,
                        axisLabelPosition: 'auto',
                        fitToPlot: 'false',
                        frame:
                            {
                                back: {visible: false},
                                bottom: {visible: false},
                                side: {visible: false}
                            }
                    }
                },
                title: {
                    text: 'Dataset categories distribution'
                },
                tooltip: {
                    headerFormat: '<span style="font-size: 15px;">{point.key} [{point.y}]</span><br/>',
                    pointFormat: '{series.name}: <b> {series.y} {point.percentage:.1f}%</b> '
                },
                plotOptions: {
                    series:
                        {
                            cursor: 'pointer',
                            events:
                                {
                                    click: function(event)
                                    {
                                        if($scope.seriesSelected == '')
                                        {
                                            initChartData (event.point.name);
                                        } else
                                            {
                                                if($scope.seriesSelected == event.point.name)
                                                {
                                                    initChartData ('');

                                                } else
                                                    {
                                                        initChartData (event.point.name);
                                                }
                                        };

                                        $scope.seriesSelected = event.point.name;
                                    }
                                }
                        },
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        // colors:['rgba(255,128,0, 0.2)','rgba(255,128,0, 0.4)','rgba(255,128,0, 0.6)','rgba(255,128,0, 0.8)','rgba(255,128,0, 1)'],
                        depth: 35,
                        dataLabels: {
                            enabled: true,
                            format: '{point.name}'
                        }
                    }
                },
                credits: {
                    enabled: false
                },
                series: [{
                    type: 'pie',
                    name: 'Datasets distribution',
                    data: aChartData
                }]
            });

            Highcharts.chart('perilCategories', {
                chart: {
                    type: 'pie',
                    options3d: {
                        enabled: false,
                        alpha: 45,
                        beta: 0,
                        depth: 100,
                        axisLabelPosition: 'auto',
                        fitToPlot: 'false',
                        frame:
                            {
                                back: {visible: false},
                                bottom: {visible: false},
                                side: {visible: false}
                            }
                    }
                },
                title: {
                    text: 'Peril distribution'
                },
                tooltip: {
                    headerFormat: '<span style="font-size: 15px;">{point.key} [{point.y}]</span><br/>',
                    pointFormat: '{series.name}: <b> {series.y} {point.percentage:.1f}%</b> '
                },
                plotOptions: {
                    series:
                        {
                            cursor: 'pointer',
                            events:
                                {
                                    click: function(event)
                                    {
                                        if($scope.seriesSelectedPeril == '')
                                        {
                                            initChartDataPeril (event.point.name);
                                        } else
                                        {
                                            if($scope.seriesSelectedPeril == event.point.name)
                                            {
                                                initChartDataPeril ('');

                                            } else
                                            {
                                                initChartDataPeril (event.point.name);
                                            }
                                        };

                                        $scope.seriesSelectedPeril = event.point.name;
                                    }
                                }
                        },
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        depth: 35,
                        // colors:['rgba(255,128,0, 0.2)','rgba(255,128,0, 0.4)','rgba(255,128,0, 0.6)','rgba(255,128,0, 0.8)','rgba(255,128,0, 1)'],
                        dataLabels: {
                            enabled: true,
                            format: '{point.name}'
                        }
                    }
                },
                credits: {
                    enabled: false
                },
                series: [{
                    type: 'pie',
                    name: 'Datasets distribution',
                    data: aChartDataPeril,
                }]
            });

        }, function(data)
        {
            // Error
        });

        $scope.calcPerc = function(nrItem, totItem){

            return ((nrItem / totItem) * 100).toFixed(0);
        }


        function initChartData (category)
        {
            $scope.iOpenIndex = 0;
            iTotalDatasets = 0;
            aTotDataset = angular.copy($scope.categoryCounters);

            if(category !== '')
            {
                aTotDataset = $filter('filter')(aTotDataset,
                    function(item)
                    {
                        return item.category == category;
                    });

                // Create structure for PIE chart
                angular.forEach(aTotDataset, function(item)
                {
                    iTotalDatasets = (iTotalDatasets * 1) + (item.count * 1);
                    $scope.iOpenIndex = $scope.iOpenIndex + (item.fullcount * 1);

                });

            } else
                {
                    // Create structure for PIE chart
                    angular.forEach($scope.categoryCounters, function(item)
                    {
                        // sLabel = item.category + ' [' + item.count + ']';
                        sLabel = item.category;
                        sData = item.count;

                        iTotalDatasets = (iTotalDatasets * 1) + (item.count * 1);
                        $scope.iOpenIndex = $scope.iOpenIndex + (item.fullcount * 1);

                        // aItem = [];
                        // aItem.push(sLabel);
                        // aItem.push(sData);
                        oItem = {};
                        oItem = {
                            name: sLabel,
                            y: sData,
                            // color: getColor[$index]
                        };

                        aChartData.push(oItem);
                    });
                };

            $scope.iOpenIndex = (($scope.iOpenIndex / iTotalDatasets) * 100).toFixed(1) * 1;
            loadGaugeChart(category);

        }

        function initChartDataPeril (category)
        {
            $scope.iOpenIndexPeril = 0;
            iTotalDatasetsPeril = 0;
            aTotDatasetPeril = angular.copy($scope.perilCounters);

            if(category !== '')
            {
                aTotDatasetPeril = $filter('filter')(aTotDatasetPeril,
                    function(item)
                    {
                        return item.name == category;
                    });

                // Create structure for PIE chart
                angular.forEach(aTotDatasetPeril, function(item)
                {
                    iTotalDatasetsPeril = (iTotalDatasetsPeril * 1) + (item.count * 1);
                    $scope.iOpenIndexPeril = $scope.iOpenIndexPeril + (item.fullcount * 1);

                });

            } else
            {
                // Create structure for PIE chart
                angular.forEach($scope.perilCounters, function(item)
                {
                    // sLabel = item.category + ' [' + item.count + ']';
                    sLabel = item.name;
                    sData = item.count;

                    iTotalDatasetsPeril = (iTotalDatasetsPeril * 1) + (item.count * 1);
                    $scope.iOpenIndexPeril = $scope.iOpenIndexPeril + (item.fullcount * 1);

                    oItem = {};
                    oItem = {
                        name: sLabel,
                        y: sData,
                        // color: getColor[$index]
                    };

                    aChartDataPeril.push(oItem);
                });
            };

            $scope.iOpenIndexPeril = (($scope.iOpenIndexPeril / iTotalDatasetsPeril) * 100).toFixed(1) * 1;
            loadGaugeChartPeril(category);

        }

        function loadGaugeChart(catTitle)
        {
            // Load the gauge chart index open data

            if(catTitle !== '' && catTitle)
            {
                catTitle = '<strong>' + catTitle + ':</strong> Open datasets index';
            } else {
                catTitle = 'Open datasets index';
            }

            Highcharts.chart('opendataIndex', {
                chart: {
                    type: 'solidgauge'
                },
                title: {
                    text: catTitle
                },
                tooltip: {
                    enabled: false
                },
                credits: {
                    enabled: false
                },
                pane: {
                    center: ['50%', '85%'],
                    size: '130%',
                    startAngle: -90,
                    endAngle: 90,
                    background: {
                        backgroundColor: '#FFFFFF',
                        innerRadius: '60%',
                        outerRadius: '100%',
                        shape: 'arc'
                    }
                },
                // the value axis
                yAxis: {
                    min: 0,
                    max: 100,
                    title: {
                        text: 'Open datasets Index'
                    },
                    stops: [
                        [0.1, 'rgba(255,128,0, 0.5)'],
                        [0.5, 'rgba(255,128,0, 0.8)'],
                        [0.9, 'rgba(255,128,0, 1)'],
                    ],
                    lineWidth: 0,
                    minorTickInterval: 'auto',
                    tickAmount: 2,
                    title: {
                        y: -70
                    },
                    labels: {
                        y: 16
                    }
                },

                plotOptions: {
                    solidgauge: {
                        dataLabels: {
                            y: 5,
                            borderWidth: 0,
                            useHTML: true
                        }
                    }
                },
                series: [{
                    name: 'OpenIndex',
                    data: [$scope.iOpenIndex],
                    dataLabels: {
                        format: '<div style="text-align:center"><span style="font-size:25px;color:' +
                        ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}</span><br/>' +
                        '<span style="font-size:12px;color:silver">% open</span></div>'
                    },
                    tooltip: {
                        valueSuffix: ' %'
                    }
                }]

            });

        }

        function loadGaugeChartPeril(catTitle)
        {
            // Load the gauge chart index open data

            if(catTitle !== '' && catTitle)
            {
                catTitle = '<strong>' + catTitle + ':</strong> Open datasets index';
            } else {
                catTitle = 'Open datasets index';
            }

            Highcharts.chart('perilOpendataIndex', {
                chart: {
                    type: 'solidgauge'
                },
                title: {
                    text: catTitle
                },
                tooltip: {
                    enabled: false
                },
                credits: {
                    enabled: false
                },
                pane: {
                    center: ['50%', '85%'],
                    size: '130%',
                    startAngle: -90,
                    endAngle: 90,
                    background: {
                        backgroundColor: '#FFFFFF',
                        innerRadius: '60%',
                        outerRadius: '100%',
                        shape: 'arc'
                    }
                },
                // the value axis
                yAxis: {
                    min: 0,
                    max: 100,
                    title: {
                        text: 'Open datasets Index'
                    },
                    stops: [
                        [0.1, 'rgba(255,128,0, 0.5)'],
                        [0.5, 'rgba(255,128,0, 0.8)'],
                        [0.9, 'rgba(255,128,0, 1)'],
                    ],
                    lineWidth: 0,
                    minorTickInterval: 'auto',
                    tickAmount: 2,
                    title: {
                        y: -70
                    },
                    labels: {
                        y: 16
                    }
                },

                plotOptions: {
                    solidgauge: {
                        dataLabels: {
                            y: 5,
                            borderWidth: 0,
                            useHTML: true
                        }
                    }
                },
                series: [{
                    name: 'OpenIndex',
                    data: [$scope.iOpenIndexPeril],
                    dataLabels: {
                        format: '<div style="text-align:center"><span style="font-size:25px;color:' +
                        ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}</span><br/>' +
                        '<span style="font-size:12px;color:silver">% open</span></div>'
                    },
                    tooltip: {
                        valueSuffix: ' %'
                    }
                }]

            });

        }

    }

    // ************************************** //
    // ************* FILTERS **************** //
    // ************************************** //

    // Setto i filtri attivi
    $scope.setFilter = function(elementKey)
    {
        if ($scope.objHazardFilters[elementKey] !== ''){
            $scope.objHazardFilters[elementKey] = "";
        } else {
            $scope.objHazardFilters[elementKey] = "active";
        }

    };

    // ************************************** //
    // ********** COUNTRIES PAGE ************ //
    // ************************************** //

    if ($location.path().indexOf('countries.html') !== -1)
    {

        $scope.filterType = "";
        $scope.filterValue = '';
        $scope.countriesFiltered = [];
        $scope.countriesListWithScore = [];
        $scope.countryGroups = [];
        $scope.sortField = "-score";
        $scope.sortPredicate = ["-datasets_open_count", "-datasets_restricted_count", "-datasets_closed_count", "name"];
        $scope.allCountries = [];
        // it holds the number of (as of Nov. 2018, the value is 36)
        $scope.keydatasetsCount = 0;
        $scope.bLoadingTabel = true;

        $scope.setFilter = function (type, value){
          if (!value) {
            $scope.filterType = '';
            $scope.filterValue = '';
            $scope.countriesFiltered = [];
          }
          else {
            $scope.filterType = type;
            $scope.filterValue = value;
            $scope.bLoadingTabel = true;

            RodiSrv.getRealCountryList([type, value]).then(function(response){
              $scope.bLoadingTabel = false;

              $scope.countriesFiltered = response.data.map(function(country){
                return country.wb_id;
              });
            });
          }
        };

        $scope.filterBy = function(country) {
          if (!$scope.filterType && !$scope.filterValue) {
            return true;
          }
          else {
            return $scope.countriesFiltered.indexOf(country.wb_id) !== -1;
          }
        };

        $scope.sortBy = function(property, alias) {
            $scope.sortField = alias || property;
            $scope.sortPredicate = property;
        }

        $scope.mergeMatrixData= function() {
          $scope.allCountries = $scope.allCountries.map(function(country){
            var countryScore = $scope.countriesListWithScore.find(function(item){
              return item.country == country.wb_id;
            });

            return Object.assign({}, country, countryScore || {country: country.wb_id, rank: 0, score: 0, fullscores_count: 0, datasets_count: 0});
          });
        };

        function initPage()
        {
            var p1 = RodiSrv.getRealCountryList().then(function (response) {
                $scope.allCountries = response.data.map(function(country){
                  // TODO: remove this map function
                  // when country list returns wb_id instead of iso2 codes
                  // cf. https://github.com/GFDRR/open-risk-data-dashboard/issues/244
                  country.wb_id = country.wb_id || country.iso2;
                  return country;
                });

                $scope.bLoadingTabel = false;
            });

            RodiSrv.getCountryGroups().then(function(response){
              $scope.countryGroups = response.data;
            });

            var p2 = RodiSrv.getCountriesScoring([$scope.filterType, $scope.filterValue], function (data) {
                $scope.keydatasetsCount = data.keydatasets_count;
                $scope.countriesListWithScore = data.countries.map(function(country){
                  country.score = Number(country.score);
                  return country;
                });
            });

            $q.all([p1, p2]).then(function(results){
              $scope.mergeMatrixData();
            });
        }

        initPage();

        $scope.colorCell = function (value) {
            return RodiSrv.matrixColorCell(value);
        }
    }

    // ************************************** //
    // ********* SUBMIT PAGE ************ //
    // ************************************** //

    if ($location.path().indexOf('contribute.html') !== -1)
    {

        $scope.tabpar = $location.search().tab;
        $scope.country_id = $location.search().country_id;
        $scope.datasetpar = $location.search().ds;
        $scope.questions = RodiSrv.getQuestions();
        $scope.bDescInfo = false;

        if($scope.tabpar)
        {
            $scope.tab = $scope.tabpar;

        } else {$scope.tab = 0;}

        // Dataset classification set
        $scope.dataCategory = [];
        $scope.dataCategoryId = "0";
        $scope.dataCategoryAll = [];
        $scope.datasetCategory = [];
        $scope.datasetCategoryAll = [];
        $scope.datasetScale = [];
        $scope.datasetScaleId = "0";
        $scope.datasetDescription = [];
        $scope.selectedLink = [];
        $scope.newLink = {meta:'', link:''};
        $scope.bLoadingUpdateScoring = false;
        $scope.bLoadingTabelReview = true;

        $scope.objDataset = RodiSrv.getDatasetEmptyStructure();

        // Load all data risk category
        RodiSrv.getDataRiskCategory(0,
            function(data)
            {
                $scope.dataCategory = data;
                $scope.dataCategoryAll = data;
            },
            function(data)
            {
                $scope.dataCategory = "--";
            }
        )

        // Load all Dataset list
        RodiSrv.getDatasetCategoryList(0,0,
            function(data)
            {

                // $scope.datasetCategory = data; -> Original without filter on National Level
                // $scope.datasetCategoryAll = angular.copy(data); -> Original without filter on National Level

                /*****************************************/
                /******** FILTER ONLY NATIONAL ***********/
                /*****************************************/

                $scope.datasetCategory = $filter('filter')(data, function(item){
                    return item.level == 'National';
                });

                $scope.datasetCategoryAll = angular.copy(data);

                /*****************************************/
                /******** FILTER ONLY NATIONAL ***********/
                /*****************************************/


                // Check dataset parameter
                if($scope.datasetpar)
                {
                    var aItem = [];
                    aItem = $filter('filter')($scope.datasetCategory, function(item)
                    {
                        return item.dataset.name == $scope.datasetpar;
                    });

                    $scope.objDataset.keydataset.dataset = aItem[0].dataset.id + '';

                    setDatasetDescription($scope.objDataset.keydataset.dataset)
                }

            },
            function(data)
            {
                $scope.datasetCategory = [];
            }
        );

        $scope.changeDataRiskSelection = function(idCategory)
        {

            $scope.lastSelectedCategoty = idCategory;
            // Filter Dataset list

            RodiSrv.getDatasetCategoryList(0,idCategory,
                function(data)
                {
                    // Set Dataset selection
                    //$scope.datasetCategory = data; -> Original without NATIONAL Filter

                    /*****************************************/
                    /******** FILTER ONLY NATIONAL ***********/
                    /*****************************************/

                    $scope.datasetCategory = $filter('filter')(data, function(item){
                        return item.level == 'National';
                    });

                    /*****************************************/
                    /******** FILTER ONLY NATIONAL ***********/
                    /*****************************************/

                    $scope.objDataset.keydataset.dataset = '0';
                    $scope.objDataset.keydataset.level = '0';
                    $scope.datasetScale = [];
                    $scope.objDataset.keydataset.description = '0';
                    $scope.datasetDescription = [];

                },
                function(data)
                {
                    // do nothing
                });
        };

        $scope.dataRiskSelectionClass = function (id) {

            return ($scope.lastSelectedCategoty == id)?'btn-warning':'btn-success';
        }

        $scope.changeDatasetSelection = function(idDataset)
        {

            setDatasetDescription(idDataset)
        }

        $scope.changeDescription = function(idDesc)
        {
            if(idDesc !== '0')
            {

                // Get level of description
                var objDesc = $filter('filter')($scope.datasetDescription,
                    function(e)
                    {
                        return e.description.code == idDesc;
                    }
                );

                var objLevel = $filter('filter')($scope.datasetScale,
                    function(e)
                    {
                        return e.level.name == objDesc[0].level;
                    }
                );

                $scope.objDataset.keydataset.description = idDesc;
                $scope.datasetScaleId = objLevel[0].level.id + "";
                $scope.objDataset.keydataset.level = $scope.datasetScaleId;

            } else
            {
                $scope.datasetScaleId = "0";
                $scope.objDataset.keydataset.level = "0";
            }
        }

        $scope.addLink = function(strLink)
        {

            //Check protocol
            var indexProtocolCheck = strLink.indexOf('http');

            if(indexProtocolCheck == -1)
            {
                //Add protocol to link
                strLink = "http://" + strLink;
            }

            var indexElem = $scope.selectedLink.indexOf(strLink);
            if(indexElem == -1)
            {
                $scope.selectedLink.push(strLink);
            }

            $scope.newLink = {meta:'', link:''};

        }

        $scope.deleteLink = function(link)
        {
            var indexElem = $scope.selectedLink.indexOf(link);

            $scope.selectedLink.splice(indexElem, 1);

        }

        RodiSrv.getCountryList().then(function(response){
                // Success
                $scope.countryList = response.data;

                // Check country parameters
                if($scope.country_id) {
                    $scope.objDataset.country = $scope.country_id;
                };

                $scope.getCountryNameReview = function(country)
                {
                    var aCountry = $filter('filter')($scope.countryList, function(item){
                        return item.wb_id == country;
                    })

                    if (aCountry.length > 0)
                    {
                        return aCountry[0].name;
                    }
                }

            });

        // $scope.questions = RodiSrv.getQuestions();

        $scope.getQuestionCode = function(questionCode)
        {
            return RodiSrv.getQuestions_code(questionCode);
        }

        $scope.saveSelection = function(qcode, value)
        {
            $scope.objDataset[qcode] = value;
        }

        $scope.saveDataset = function()
        {
            var aErrorsValidation = [];

            // Set tags and links
            $scope.objDataset.url = $scope.selectedLink;

            // Validate Dataset structure
            aErrorsValidation = RodiSrv.validateDataset($scope.objDataset);

            if(aErrorsValidation.length > 0) {
                // Errors
                var strMsg = "Required fields: <ul>";
                for(var i=0; i< aErrorsValidation.length; i++)
                {
                    strMsg += '<li>' + aErrorsValidation[i] + '</li> ';
                }

                strMsg += "</ul>";
                vex.dialog.alert(strMsg);

            } else {
                // Get the pk_id of Keydataset
                RodiSrv.getKeydatasetId($scope.datasetScaleId, $scope.dataCategoryId,
                    $scope.objDataset.keydataset.dataset, $scope.objDataset.keydataset.description,
                    function(data)
                    {
                        // Success
                        $scope.objDataset.keydataset = data[0].code;

                        // Save the dataset structure
                        RodiSrv.saveprofileDataset($scope.tokenid, $scope.objDataset,
                            function(data){
                                // Success

                                vex.dialog.alert("Thanks! Dataset was successfully submitted and will be reviewed.");
                                $scope.objDataset = RodiSrv.getDatasetEmptyStructure();
                                $scope.selectedLink = [];
                                $scope.newLink = "";
                                $scope.newLink = {meta:'', link:''};

                                $window.scrollTo(0,0);

                            }, function(error){
                            //     Error
                                console.error(error);
                                vex.dialog.alert("Unable to save the dataset data: " + error.data);
                            })

                    }, function(error)
                    {
                        // Error
                        console.error('Error');
                        console.error(error);
                    })
            }

        }

        $scope.questionHelp = function(index)
        {
            vex.dialog.alert(RodiSrv.getQuestionsHelp(index));
        }

        function setDatasetDescription(idDataset)
        {

            $scope.datasetDescription = [];

            if(idDataset !== '0')
            {
                $scope.bDescInfo = true;
                // Dataset selected
                // get the dataset obj
                var aFiltered = [];

                aFiltered = $filter('filter')($scope.datasetCategoryAll, function(e)
                {
                    return e.dataset.id == idDataset;
                });

                // Get data risk category ID
                var aCategory = $filter('filter')($scope.dataCategoryAll,
                    function(e)
                    {
                        return e.category.name == aFiltered[0].category;
                    }
                );

                $scope.dataCategoryId = aCategory[0].category.id + "";
                $scope.objDataset.keydataset.category = $scope.dataCategoryId;

                // Set dataset description selection
                RodiSrv.getDescription(0, $scope.dataCategoryId, idDataset,
                    function(data)
                    {

                        // $scope.datasetDescription = data; -> Original without National Filter

                        /*****************************************/
                        /******** FILTER ONLY NATIONAL ***********/
                        /*****************************************/

                        $scope.datasetDescription = $filter('filter')(data, function(item){
                            return item.level == "National";
                        });

                        /*****************************************/
                        /******** FILTER ONLY NATIONAL ***********/
                        /*****************************************/

                        //Set National description like default selection
                        var nationalDesc = $filter('filter')($scope.datasetDescription, function(item){
                            return item.level == "National";
                        });

                        if (nationalDesc.length > 0){
                            // Find National description
                            $scope.objDataset.keydataset.description = nationalDesc[0].description.code;
                        } else {
                            $scope.objDataset.keydataset.description = '0';
                        }

                        $scope.objDataset.keydataset.level = '0';

                        // Get Dataset scale available
                        RodiSrv.getLevelList(
                            function(data)
                            {
                                $scope.datasetScale = $filter('filter')(data,
                                    function(e)
                                    {
                                        var i = 0;
                                        var aLevel = [];

                                        while (i <=  $scope.datasetDescription.length - 1)
                                        {
                                            if(e.level.name ==  $scope.datasetDescription[i].level)
                                            {
                                                aLevel.push(e);
                                            }
                                            i +=1;
                                        }

                                        if (aLevel.length > 0) {return aLevel;}
                                    }
                                );

                            }, function(data) {}
                        );

                    },
                    function(error)
                    {
                        console.error(error);
                    }
                );
            } else
            {
                $scope.bDescInfo = false;
                $scope.objDataset.keydataset.level = '0';
                $scope.datasetScale = [];
                $scope.objDataset.keydataset.description = '0';
                $scope.datasetDescription = [];
            }
        }

        $scope.updateScoringMan = function()
        {
            // Update scoring manually

            $scope.bLoadingUpdateScoring = true;

            RodiSrv.updateScoring($scope.tokenid,
                function(data)
                {
                    // Success

                    $scope.bLoadingUpdateScoring = false;
                    vex.dialog.alert("Scoring updated correctly");

                }, function(error)
                {
                    // Error
                    console.error(error);
                    vex.dialog.alert("Error: " + error.data);
                })

        }

        // ************************************** //
        // ****** USER PROFILE & DATA *********** //
        // ************************************** //

        $scope.$watch('bLogin', function() {

            if ($scope.bLogin){
                $scope.tokenid = localStorage.getItem('rodi_token');
                $scope.userinfo = JSON.parse(localStorage.getItem('rodi_user'));
            }

            // ************************************** //
            // ********** ADMIN FUNCTIONS *********** //
            // ************************************** //

            if ($scope.bLogin && $scope.userinfo.groups[0] == 'admin')
            {

                $scope.usradmininfo = RodiSrv.getUserStructureEmpty();
                $scope.usrRegList = [];
                $scope.stypeModal = "";
                $scope.groupSelect = null;

                RodiSrv.getUsersList($scope.tokenid,
                    function(data){
                        //Success
                        $scope.usrRegList = data;

                        $scope.openPopup = function (pk)
                        {

                            if(pk == -999)
                            {
                                // New user
                                $scope.stypeModal = "insert new profile";
                                $scope.usradmininfo = RodiSrv.getUserStructureEmpty();

                            } else {
                                // Edit user profile
                                var aUserProfile = $filter('filter')($scope.usrRegList, {pk: pk});
                                $scope.usradmininfo = aUserProfile[0];

                                if($scope.usradmininfo.groups.length == 0){
                                    $scope.groupSelect = 'normal';
                                } else {
                                    $scope.groupSelect = $scope.usradmininfo.groups[0];
                                }

                                $scope.stypeModal = "edit";
                            }


                            $('#editUser').modal('show');
                        }

                        $scope.saveUsrInfoAdmin = function()
                        {

                            if($scope.groupSelect == 'admin')
                            {
                                $scope.usradmininfo.is_staff = true;
                            }
                            else {
                                $scope.usradmininfo.is_staff = false;
                            }

                            if($scope.groupSelect == 'normal'){
                                $scope.usradmininfo.groups = [];
                            } else {
                                $scope.usradmininfo.groups[0] = $scope.groupSelect;
                            }

                            if($scope.usradmininfo.pk == -999)
                            {
                                // New user
                                // Check empty values and  password/confirm password
                                if($scope.usradmininfo.username !== '' && $scope.usradmininfo.password !=='' && $scope.usradmininfo.email !==''){

                                    //Check password equal confirm_password
                                    if ($scope.usradmininfo.password == $scope.usradmininfo.confirm_password){

                                        //Save data
                                        RodiSrv.insertUserInfo($scope.tokenid, $scope.usradmininfo,
                                            function(data){
                                                // Success
                                                vex.dialog.alert('User info saved successfully');

                                                $scope.usrRegList.push($scope.usradmininfo);

                                                RodiSrv.getUsersList($scope.tokenid,
                                                    function(data){
                                                        // Success
                                                        $scope.usrRegList = data;
                                                    }, function(data){
                                                        // Error
                                                    })

                                            }, function(data){
                                                // Error
                                                var sMsg = "";
                                                angular.forEach(data, function(value, key) {
                                                    sMsg += key.replace("_"," ") + ': ' + value + '<br /> ';

                                                });
                                                vex.dialog.alert(sMsg);
                                            })
                                    } else {
                                        // Password e confirm password not match
                                        vex.dialog.alert('Password and confirm password must be the same!');
                                    }

                                } else {
                                    // There are some fields empty
                                    vex.dialog.alert('All fields are required!');
                                }



                            } else {
                                // Edit User profile

                                if($scope.usradmininfo.email !=='')
                                {
                                    RodiSrv.saveUserInfo($scope.tokenid, $scope.usradmininfo,
                                        function(data){
                                            // Success
                                            vex.dialog.alert('User info saved successfully');
                                        }, function(data){
                                            // Error
                                            vex.dialog.alert('Error: unable to save data');
                                        }
                                    )
                                } else {
                                    vex.dialog.alert('All fileds are required!');
                                }


                            }
                        }

                        $scope.deleteUsrInfoAdmin = function(pk)
                        {
                            vex.dialog.confirm({
                                message: 'Are you absolutely sure you want to delete this user profile?',
                                callback: function (value) {
                                    if(value)
                                    {
                                        // Delete profile
                                        RodiSrv.deleteUserInfo($scope.tokenid, pk,
                                            function(data){
                                                // Success

                                                // Reload data from server
                                                RodiSrv.getUsersList($scope.tokenid,
                                                    function(data){
                                                        // Success
                                                        $scope.usrRegList = data;
                                                    }, function(data){
                                                        // Error
                                                    })

                                            }, function(data){
                                                // Error
                                                vex.dialog.alert('Error: unable to delete data');
                                            })
                                    }
                                }
                            })
                        }

                    }, function(data){
                        // Error
                        // Fai nulla
                    }
                );
            }


            // ************************************** //
            // ****** ADMIN/REVIEWER FUNCTIONS ****** //
            // ************************************** //

            if ($scope.bLogin && $scope.userinfo.groups[0] == 'reviewer' || $scope.userinfo.groups[0] == 'admin'){

                // ************************************** //
                // ******* DATASET NOT REVIWERED ****** //
                // ************************************** //

                $scope.bDatasetReview = true;
                $scope.datasetReviewList = [];
                $scope.iNrDatasetToReview = 0;
                $scope.reviewCountryFilter = "";

                RodiSrv.getAllDatasetList(
                    function(data)
                    {
                        // Success

                        $scope.datasetReviewList = $filter('filter')(data, {'is_reviewed': false});

                        $scope.tableParamsReview = new NgTableParams({count: $scope.datasetReviewList.length}, { dataset: $scope.datasetReviewList});

                        if ($scope.datasetReviewList.length > 0)
                        {
                            $scope.iNrDatasetToReview = $scope.datasetReviewList.length;
                            $scope.bDatasetReview = true;

                        } else {$scope.bDatasetReview = false;}

                        $scope.bLoadingTabelReview = false;

                    }, function(error)
                    {
                        // Error
                        console.error(error);
                    })
            }

            // ************************************** //
            // ********* ALL USER FUNCTIONS ********* //
            // ************************************** //

            $scope.myDatasetList = [];
            $scope.iNrMyDataset = 0;

            if ($scope.bLogin)
            {
                // Profile dataset list
                $scope.bDatasetProfile = false;
                RodiSrv.getProfileDataset($scope.tokenid,
                    function(data){
                        // Success
                        if (data.length > 0)
                        {
                            $scope.iNrMyDataset = data.length;
                            $scope.myDatasetList = data;
                            $scope.bDatasetProfile = true;

                            $scope.tableParams = new NgTableParams({}, { dataset: $scope.myDatasetList});

                        } else {$scope.bDatasetProfile = false;}
                    }, function(data){
                        // Error
                        $scope.bDatasetProfile = false;
                    })
            }

        });

        $scope.putProfile = function()
        {
            // Save new profile data

            if(!$scope.userinfo.email == '')
            {
                RodiSrv.saveProfile($scope.tokenid, $scope.userinfo,
                    function(data){
                        //Success

                        //Update cookies info with DB data
                        RodiSrv.getUserInfo($scope.tokenid,
                            function(data){
                                //Success

                                localStorage.removeItem('rodi_user');
                                $scope.userinfo = {pk:data.pk, username:data.username, first_name:data.first_name, last_name:data.last_name, email:data.email, groups:data.groups, title:data.title, institution:data.institution};
                                localStorage.setItem('rodi_user', JSON.stringify($scope.userinfo));
                                vex.dialog.alert('Profile saved successfully');

                            }, function(data){
                                // Error
                                localStorage.removeItem('rodi_token');


                                vex.dialog.alert('Login error: unable to retrieve your information');
                                $scope.userinfo = RodiSrv.getUserStructureEmpty();

                                $scope.bLogin = false;
                            }
                        );



                    }, function(data){
                        // Error
                        vex.dialog.alert('Error: unable to save data');
                    }
                );
            } else {
                vex.dialog.alert('E-mail field is required!');
            }

        }

        $scope.resetProfilePsw = function(old_psw, new_psw, confirm_psw)
        {
            // Resetto la password per il profilo

            if(old_psw != '' && new_psw != ''){
                // All fileds are compiled
                if(confirm_psw == new_psw)
                {
                    // New password e confirm password corrisponded
                    RodiSrv.resetProfilePsw($scope.tokenid, old_psw, new_psw,
                        function(data){
                            // Success
                            vex.dialog.alert('Password update!');
                        }, function(data){
                            // Error
                            var sMsg = "";
                            angular.forEach(data, function(value, key) {
                                sMsg = key.replace("_"," ") + ': ' + value
                            });

                            vex.dialog.alert(sMsg);

                        })

                } else {
                    vex.dialog.alert('Error: New password and password confirmation are not the same');
                }
            } else {
                vex.dialog.alert('Error: You must insert old password, new password and confirm the new password');
            }
        }

    }

    // ************************************** //
    // ******** COMMON FUNCTIONS ************ //
    // ************************************** //

    $scope.formatStringLenght = function(desc){
        var shortLink = "";

        if (desc.length > 70)
        {
            shortLink = desc.substr(0, 70);
            shortLink = shortLink + ' ...';
        } else {
            shortLink = desc;
        }

        return shortLink;

    }

} ]);
