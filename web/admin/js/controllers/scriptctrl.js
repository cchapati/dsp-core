/**
 * This file is part of the DreamFactory Services Platform(tm) (DSP)
 *
 * DreamFactory Services Platform(tm) <http://github.com/dreamfactorysoftware/dsp-core>
 * Copyright 2012-2014 DreamFactory Software, Inc. <support@dreamfactory.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var ScriptCtrl = function ($scope, Event, Script, DB, Config, $http) {
    Scope = $scope;
    var editor;
    (
        function () {
            DB.get().$promise.then(
                function (response) {
                    $scope.tables = response.resource;
                    $scope.buildEventList();
                }
            )
            $scope.Config = Config.get(
                function (response) {
                    if (response.is_private || !response.is_hosted) {
                        editor = ace.edit("editor");
                        editor.getSession().setMode("ace/mode/javascript");

                        $scope.loadSamples();

                    }
                }
            );
            //get ALL events

            $scope.buildEventList = function () {
                Event.get({"all_events": "true"}).$promise.then(
                    function (response) {
                        $scope.Events = response.record;
                        $scope.Events.forEach(function (event) {
                            if (event.name === "db") {
                                $scope.tables.forEach(
                                    function (table) {
                                        var newPath = {};
                                        newPath.path = "/db/" + table.name;
                                        newPath.verbs = [
                                            {"type": "get",
                                                "event": ["db." + table.name + ".select"
                                                ]},
                                            {
                                                "type":"get",
                                                "event" : ["db." + table.name + ".get.pre_process"]
                                            },
                                            {
                                                "type":"get",
                                                "event" : ["db." + table.name + ".get.post_process"]
                                            },
                                            {"type": "put",
                                                "event": [
                                                    "db." + table.name + ".update"
                                                ]},
                                            {
                                                "type":"put",
                                                "event" : ["db." + table.name + ".put.pre_process"]
                                            },
                                            {
                                                "type":"put",
                                                "event" : ["db." + table.name + ".put.post_process"]
                                            },
                                            {"type": "post",
                                                "event": [
                                                    "db." + table.name + ".insert"
                                                ]},
                                            {
                                                "type":"post",
                                                "event" : ["db." + table.name + ".post.pre_process"]
                                            },
                                            {
                                                "type":"post",
                                                "event" : ["db." + table.name + ".post.post_process"]
                                            },
                                            {"type": "delete",
                                                "event": [
                                                    "db." + table.name + ".delete"
                                                ]},
                                            {
                                                "type":"delete",
                                                "event" : ["db." + table.name + ".delete.pre_process"]
                                            },
                                            {
                                                "type":"delete",
                                                "event" : ["db." + table.name + ".delete.post_process"]
                                            }
                                        ];
                                        event.paths.push(newPath);
                                    }
                                );
                            }else{
                                event.paths.forEach(function (path) {
                                    var preEvent, postEvent, preObj, postObj;
                                    var pathIndex = path.path.lastIndexOf("/") + 1;
                                    var pathName = path.path.substr(pathIndex);
                                    path.verbs.forEach(function (verb) {
                                        preEvent = pathName + "." + verb.type + "." + "pre_process";
                                        preObj = {"type": verb.type, "event": [preEvent]};
                                        postEvent = pathName + "." + verb.type + "." + "post_process";
                                        postObj = {"type": verb.type, "event": [postEvent]};
                                        path.verbs.push(preObj);
                                        path.verbs.push(postObj);
                                    });

                                });
                            }


                            //
                        });


                    }
                );
            };


        }()
        );

    $scope.loadSamples = function () {

        $http.defaults.headers.common['Accept'] = 'text/plain';
        $http({
            method: 'GET',
            url: 'js/example.scripts.js',
            dataType: "text"
        }).success(function (response) {
            $scope.currentScript = null;
            $scope.hasContent = false;
            $scope.exampleScripts = response;
            editor.setValue(response);
        });

    };
    $scope.showSamples = function () {
        $scope.currentScript = null;
        $scope.hasContent = false;
        editor.setValue($scope.exampleScripts);
    };
    $scope.loadScript = function () {
        editor.setValue('');
        $scope.currentScript = this.event;
        $scope.scriptPath = this.path.path;
        $scope.verb = angular.uppercase(this.verb.type);
        $scope.hasContent = false;
        var script_id = {"script_id": $scope.currentScript};
        Script.get(script_id).$promise.then(
            function (response) {
                editor.setValue(response.script_body);
                $scope.hasContent = true;
                $.pnotify(
                    {
                        title: $scope.currentScript,
                        type: 'success',
                        text: 'Loaded Successfully'
                    }
                );

            },
            function () {
                $scope.hasContent = false;

            }

        );


    };
    $scope.loadEvent = function () {
        if ($scope.currentEvent === this.event.name) {
            $scope.currentEvent = null;
        }
        else {
            $scope.currentEvent = this.event.name;
        }

    };
    $scope.saveScript = function () {
        var script_id = {"script_id": $scope.currentScript};
        var post_body = editor.getValue() || " ";

        Script.update(script_id, post_body).$promise.then(
            function (response) {
                $.pnotify(
                    {
                        title: $scope.currentScript,
                        type: 'success',
                        text: 'Saved Successfully'
                    }
                );
                $scope.hasContent = true;
            }
        );

    };
    $scope.deleteScript = function () {
        var script_id = {"script_id": $scope.currentScript};
        editor.setValue("");


        Script.delete(script_id).$promise.then(
            function (response) {
                $.pnotify(
                    {
                        title: $scope.currentScript,
                        type: 'success',
                        text: 'Deleted Successfully'
                    }
                );
            }
        );

    };
    $scope.loadPath = function () {
        $scope.path = this.path.path;
        if ($scope.currentPath === this.path.path) {
            $scope.currentPath = null;
        }
        else {
            $scope.currentPath = this.path.path;
        }
    }

};
