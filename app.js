document.addEventListener("DOMContentLoaded", function(){

    var scene, camera, renderer, controls;
    var geometry, material, mesh;

    var raycaster;
    var mouse;
    var currentRoute;

    var clickEvents= {};

    var routes = {
        main:
        {
            path: "main.json",
            name: "main",
            scene: null
        },
        A5:
        {
            name: "A5",
            panel: "floors",
            children:
            {
                "0":
                {
                    name:"A50",
                    path: "A50.json",
                    offset: 0,
                    scene:null
                },
                "E":
                {
                    name:"A5E",
                    path: "A50.json",
                    offset: 50,
                    scene:null
                },
                "1":
                {
                    name:"A51",
                    path: "A51.json",
                    offset: 150,
                    scene:null
                },
                "2":
                {
                    name:"A52",
                    path: "A52.json",
                    offset: 200,
                    scene:null
                }
            }
        },
        A6:
        {
            name: "A6",
            panel: "floors",
            children:
            [
                {
                    name:"A60",
                    path: "A60.json",
                    offset: 0,
                    scene:null
                },
                {
                    name:"A6E",
                    path: "A6E.json",
                    offset: 1,
                    scene:null
                },
                {
                    name:"A61",
                    path: "A61.json",
                    offset: 2,
                    scene:null
                },
                {
                    name:"A62",
                    path: "A62.json",
                    offset: 3,
                    scene:null
                }
            ]
        },
        cube:
        {
            path: "cube.json",
            name: "cube",
            scene: null
        }
    };

    var HASH_PREFIX = "/map/";
    var DEFAULT_ROUTE = "main";
    var HIDE_TIME = 200;




    function init() {


        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();


        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.001, 10000 );
        camera.position.z = 3;
        camera.position.y = 3;
        camera.position.x = 6;




        //Renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setClearColor(0xffffff);
        controls = new THREE.OrbitControls(camera, renderer.domElement),


        document.body.appendChild( renderer.domElement );

        initEvents();

        //Force Load Scene
        onHashChange();
        

    }

    function initEvents(){
        document.addEventListener("mousemove",onMouseMove);
        document.addEventListener("click",onMouseClick);
        window.addEventListener("hashchange",onHashChange);

        clickEvents["A5"] = function(){
            goTo(routes.A5.name);
        };

        clickEvents["A6"] = function(){
            goTo(routes.A6.name);
        };
    }

    function goTo(route){
        window.location.hash = "#"+HASH_PREFIX+route;
    }

    function initLights(){
        var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.8 );
        hemiLight.color.setHSL( 0.6, 1, 0.6 );
        hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
        hemiLight.position.set( 0, 500, 0 );

        var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
        dirLight.color.setHSL( 0.1, 1, 0.95 );
        dirLight.position.set( -1, 1.75, 1 );
        dirLight.position.multiplyScalar( 50 );
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        var d = 50;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.camera.far = 3500;
        dirLight.shadow.bias = -0.0001;
        

        scene.add( hemiLight );
        scene.add( dirLight );
    }


    function onMouseMove( event ) {

        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;     

    }

    function onMouseClick(){
        mousePick();
        if(selected)
        {
            if(clickEvents[selected.object.name])
            {
                clickEvents[selected.object.name]();   
            }
        }
    }

    function onHashChange(){
        hide(renderer.domElement, function(){
            if(window.location.hash && window.location.hash.indexOf(HASH_PREFIX) != -1)
            {
                clearScene();
                initLights();
                var route = window.location.hash.slice(window.location.hash.indexOf(HASH_PREFIX) + HASH_PREFIX.length);
                loadRoute( route, function(){
                    routeChanged(route);
                    show(renderer.domElement);
                    
                }); 

            }
            else
            {
                goTo(DEFAULT_ROUTE);
            }
        });

    }

    function hide(element, cb){
        element.classList.add("hidden");
        if(cb)
        {
            setTimeout(cb, HIDE_TIME);
            
        }
    }

    function show(element)
    {
        element.classList.remove("hidden");
    }

    function mousePick(){
        // update the picking ray with the camera and mouse position    
        raycaster.setFromCamera( mouse, camera );   

        // calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects( scene.children, true);
        selected = intersects[0] || null;

        
    }

    function loadRoute(route, cb){
        var first = route.split("/")[0];
        var second = route.split("/")[1];
        var loader = new THREE.ObjectLoader();
        if(routes[ first ])
        {
            //Routes without path are considered abstract
            if(routes[ first ].path)
            {
                if(!routes[ first ].scene)
                {
                    loader.load(routes[ first ].path, function(obj){            
                        routes[ first ].scene = obj;
                        scene.add(obj);
                        if(cb) cb();
                    });
                }
                else
                {
                    scene.add(routes[ first ].scene);
                    if(cb) cb();
                }
            }
            else
            {
                var loadedChildren = 0;
                for(var i = 0; i < routes[first].children.length; i++)
                {
                    if(!second || second == i)
                    {
                        (function(index){
                            if(!routes[ first ].children[ index ].scene)
                            {
                                loader.load(routes[ first ].children[ index ].path, function(obj){
                                    obj.position.y = routes[ first ].children[ index ].offset;
                                    routes[ first ].children[ index ].scene = obj;
                                    scene.add(obj);
                                    loadedChildren++;
                                });
                            }
                            else
                            {
                                scene.add(routes[ first ].children[ index ].scene);
                                loadedChildren++;
                            }          
                        })(i);
                    }
                }

                function checkLoaded(){
                    if( (!second && loadedChildren != routes[first].children.length) ||
                        (second && loadedChildren != 1) )
                        setTimeout(checkLoaded, 100);
                    else
                        if(cb) cb();
                }

                checkLoaded();

                
            }
        }
        else
        {
            //404
            console.warn("Route not found");
            loadRoute("cube");
        }
    }

    function routeChanged(route){
        currentRoute = route;
        var panels = document.querySelectorAll(".panel");
        for(var i =0; i < panels.length; i++)
        {
            panels[i].classList.remove("active");
        }

        var parentPanel = routes[ route.split("/")[0] ].panel;
        if(parentPanel)
            document.querySelector("#"+parentPanel).classList.add("active");
    }

    function clearScene(){
        for(var i = scene.children.length-1; i >= 0; i--)
        {
            scene.children[i].parent.remove(scene.children[i]);
        }

    }

    function animate() {

        requestAnimationFrame( animate );

        mousePick();

        //mesh.rotation.x += 0.01;
        //mesh.rotation.y += 0.02;

        controls.update();
        renderer.render( scene, camera );
    }






    init();
    animate();
    
});