/**
 * Globe animation adapted from https://codepen.io/giddynaya/pen/LYgZyOX
 * (Three.js r108, container-sized canvas).
 */
(function () {
  var THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/108/three.min.js';
  var threeLoadPromise = null;

  function ensureThree() {
    if (typeof window.THREE !== 'undefined') {
      return Promise.resolve();
    }
    if (threeLoadPromise) {
      return threeLoadPromise;
    }
    threeLoadPromise = new Promise(function (resolve, reject) {
      var s = document.querySelector('script[data-global-spotlight-three]');
      if (s) {
        function onLoad() {
          s.removeEventListener('load', onLoad);
          s.removeEventListener('error', onErr);
          resolve();
        }
        function onErr() {
          s.removeEventListener('load', onLoad);
          s.removeEventListener('error', onErr);
          threeLoadPromise = null;
          reject(new Error('Three.js failed to load'));
        }
        s.addEventListener('load', onLoad);
        s.addEventListener('error', onErr);
        return;
      }
      s = document.createElement('script');
      s.src = THREE_CDN;
      s.async = true;
      s.setAttribute('data-global-spotlight-three', '');
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        threeLoadPromise = null;
        reject(new Error('Three.js failed to load'));
      };
      document.head.appendChild(s);
    });
    return threeLoadPromise;
  }

  function initGlobalSpotlightGlobe(canvas) {
    if (!canvas || typeof THREE === 'undefined') return;

    var container = canvas.parentElement;
    if (!container) return;

    var AMOUNT = 200,
      d = 25,
      R = 200,
      adjustment = true,
      adaptive = true,
      obliquity = (23 / 180) * 3.14,
      roV1 = 0.0032,
      roV2 = -0.0005,
      ro1 = 0,
      ro2 = 0,
      color = '#000000',
      fogC = '#610c27',
      T_earth = 'https://mapplix.github.io/earth/earth.png';

    var camera, scene, renderer;
    var positions = [],
      particles,
      count = 0,
      dpr,
      lastW;
    var mouseX = 0,
      mouseY = 0,
      x0,
      y0;
    var world, hLight, Net, Earth;

    function readSize() {
      var w = Math.max(1, Math.floor(container.clientWidth));
      var h = Math.max(1, Math.floor(container.clientHeight));
      return { W: w, H: h };
    }

    var WH = readSize();
    var W = WH.W,
      H = WH.H;
    var aspect = W / H;
    var vMin = Math.min(W, H);

    var lookAt = new THREE.Vector3(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas: canvas });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);

    camera = new THREE.PerspectiveCamera(18, aspect, 1, 10000);
    scene = new THREE.Scene();

    var Emap = new THREE.TextureLoader().load(T_earth);
    Emap.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()) || 1;

    var posZ = 1700;

    var Wmaterial = new THREE.MeshStandardMaterial({
      onBeforeCompile: function (sh) {
        sh.vertexShader =
          '#define MYSHADER\n' +
          'attribute float center, bright;\n' +
          'varying vec3 vCenter, vPos, vV0, vV1, vV2;\n' +
          'varying float vBright;\n' +
          sh.vertexShader.replace(
            /}\s*$/,
            '\n	vBright=bright;\n	int c=int(center);\n	vCenter = vec3(c==0, c==1, c==2);\n	vPos=position;\n	gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1);\n	vV0=vCenter[0]*vPos;\n	vV1=vCenter[1]*vPos;\n	vV2=vCenter[2]*vPos;\n}\t\t\t'
          );
        sh.fragmentShader =
          '#define MYSHADER\n' +
          'varying vec3 vCenter, vPos, vV0, vV1, vV2;\n' +
          'varying float vBright;\n' +
          sh.fragmentShader
            .replace(
              '#include <alphamap_fragment>',
              '\n	#include <alphamap_fragment>\n	vec3 d = fwidth( vCenter );\n	vec3 a3 = smoothstep( vec3(0.0), d * 1.4, vCenter+0.4*d-1.0/fogDepth );\n	float scale = dot(normalize(vViewPosition), vNormal);\n	scale = 1.0-scale*scale;\n	float dist = distance(vPos, vV0.xyz/vCenter.x);\n	dist = min(dist, distance(vPos, vV1.xyz/vCenter.y));\n	dist = min(dist, distance(vPos, vV2.xyz/vCenter.z));\n	float b3 = smoothstep(1.5, 1.8, dist-1.5*scale*scale );\n	float edgeFactorTri=min(b3,min( min( a3.x, a3.y ), a3.z ));\n	diffuseColor.a *= mix( 1.0,  0.0, edgeFactorTri );\n	float dissipation=' +
                (posZ + 0.5 * R + 0.01) +
                ';\n	diffuseColor.a *= smoothstep( 20.0,  0.0, fogDepth-dissipation );\n\			'
            )
            .replace(
              '	#include <fog_fragment>',
              '\n	float lVc=length(vCenter);\n	gl_FragColor.rgb *= smoothstep( ' +
                R * 0.8888 +
                ', ' +
                R * 1.201 +
                ', fogDepth );\n	gl_FragColor.rgb = mix( gl_FragColor.rgb, vec3(3), (.1*lVc+pow(lVc,8.0))*vBright );\n	#include <fog_fragment>\n\			'
            );
      },
      roughness: 0.5,
      metalness: 0.964,
      envMapIntensity: 5,
      emissive: 0,
      transparent: true,
      alphaTest: 0.75,
    });

    Wmaterial.color.set(fogC);
    Wmaterial.side = 2;
    Wmaterial.extensions = { derivatives: 1 };

    var geometry = new THREE.IcosahedronGeometry(R, 3);

    for (var vi = 0; vi < geometry.vertices.length; vi++) {
      geometry.vertices[vi].applyEuler(
        new THREE.Euler(Math.random() * 0.06, Math.random() * 0.06, Math.random() * 0.06)
      );
    }

    var bGeometry = new THREE.BufferGeometry().fromGeometry(geometry);
    var position = bGeometry.attributes.position;
    var centers = new Int8Array(position.count);
    var brights = new Float32Array(position.count);
    var points = [],
      activePoints = [],
      vCount = geometry.vertices.length,
      dCount = 0,
      dMid = 0;

    for (var i = 0, l = position.count; i < l; i++) {
      var c = (centers[i] = i % 3),
        j = (i - c) / 3;
      brights[i] = 0;
      if (i < vCount) {
        points[i] = {
          siblings: [],
          distances: [],
          indexes: [],
          brightness: 0,
          v: 0,
          a: 0,
          f: 0,
          dr: 0,
          r: 1,
        };
      }
    }

    function addSiblings(a, b, one) {
      if (points[a].siblings.indexOf(points[b]) < 0) {
        points[a].pos = geometry.vertices[a].clone();
        points[a].siblings.push(points[b]);
        var dist = geometry.vertices[a].distanceTo(geometry.vertices[b]);
        points[a].distances.push(dist);
        dMid += dist;
        dCount++;
      }
      if (!one) addSiblings(b, a, 1);
    }

    geometry.faces.forEach(function (face, faceIndex) {
      addSiblings(face.a, face.b);
      addSiblings(face.a, face.c);
      addSiblings(face.c, face.b);
      points[face.a].indexes.push(faceIndex * 3);
      points[face.b].indexes.push(faceIndex * 3 + 1);
      points[face.c].indexes.push(faceIndex * 3 + 2);
    });

    dMid /= dCount;
    var ttl = 10;
    (function setActive(n) {
      if (!n) return;
      var idx = parseInt(Math.random() * vCount, 10);
      if (geometry.vertices[idx].z < -100) setActive(n);
      else {
        points[idx].isActive = ttl;
        activePoints.push(points[idx]);
        setActive(n - 1);
      }
    })(10);

    bGeometry.addAttribute('center', new THREE.BufferAttribute(centers, 1));
    bGeometry.addAttribute('bright', new THREE.BufferAttribute(brights, 1));

    var Ematerial = Wmaterial.clone();
    Ematerial.alphaMap = Emap;
    Ematerial.transparent = false;
    Ematerial.side = 0;

    var cubeCamera = new THREE.CubeCamera(1, 2 * R, 256);
    cubeCamera.position.z = 0.47 * R;
    Ematerial.envMap = cubeCamera.renderTarget.texture;
    Ematerial.envMap.minFilter = THREE.LinearMipMapLinearFilter;
    Ematerial.envMap.mapping = THREE.CubeReflectionMapping;

    Earth = new THREE.Mesh(new THREE.IcosahedronGeometry(R * 0.77, 3), Ematerial);
    var wGeometry = geometry.clone();
    particles = new THREE.Group();
    world = new THREE.Group();
    Net = new THREE.Mesh(bGeometry, Wmaterial);
    particles.add(Net, Earth);
    world.add(particles);
    scene.add(world);

    scene.fog = new THREE.Fog(fogC, posZ - R / 2, posZ + R);
    hLight = new THREE.HemisphereLight('#fff', 0, 23);
    world.add(hLight);
    hLight.position.set(0, 0, 1);

    var dx,
      dy,
      active,
      abc = ['a', 'b', 'c'],
      movedPoints = [],
      activeF = [],
      ready;
    dx = dy = x0 = y0 = 0;

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var point;

    function interact() {
      mouse.x = (x0 / W) * 2 - 1;
      mouse.y = -(y0 / H) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      movedPoints.forEach(function (p) {
        p.f = 0;
      });
      activeF = [];
      if (!active) return;
      var inters = raycaster.intersectObject(Net)[0],
        ind,
        vert;
      if (!inters) return;
      point = Net.worldToLocal(inters.point.clone());
      for (var fi = 0; fi < 3; fi++) {
        ind = inters.face[abc[fi]];
        if (
          !points.some(function (p, pi) {
            return p.indexes.indexOf(ind) >= 0 && (vert = pi + '');
          })
        ) {
          return;
        }
        activeF[vert] = Math.max(1 - point.distanceTo(points[vert].pos) / dMid, 0) * 100;
      }
    }

    function onPointerDown(e) {
      active = e.changedTouches ? e.changedTouches[0] : e;
      x0 = active.clientX;
      y0 = active.clientY;
      e.preventDefault();
      interact();
    }

    function onPointerMove(e) {
      if (!active || !ready) return;
      if (!e.buttons && e.type !== 'touchmove') {
        active = false;
        return;
      }
      var touches = e.changedTouches;
      if (active.identifier !== undefined && e.type !== 'touchmove') return;
      if (touches) {
        if (touches[0].identifier === active.identifier) e = touches[0];
        else return;
      } else {
        e.preventDefault();
      }
      dx = (5 * dx + x0 - (x0 = e.clientX)) / 6;
      dy = (5 * dy + y0 - (y0 = e.clientY)) / 6;
      interact();
      ready = 0;
    }

    function onPointerUp() {
      active = false;
      interact();
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('touchcancel', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('blur', onPointerUp);

    var t0 = new Date() * 1,
      dMax = 80,
      dMin = 1000 / 33,
      dT = 1000 / 50,
      m = 3000000,
      k = 400,
      k0 = 1,
      fv = 1000,
      posArr = bGeometry.attributes.position.array;

    var resizeObserver = new ResizeObserver(function () {
      var next = readSize();
      if (next.W !== W || next.H !== H) {
        W = next.W;
        H = next.H;
        vMin = Math.min(W, H);
        aspect = W / H;
        renderer.setSize(W, H, false);
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }
    });
    resizeObserver.observe(container);

    function animate() {
      requestAnimationFrame(animate);
      var t = new Date() * 1,
        dt = t - t0;
      if (dt < dMin) return;
      dt = Math.min(dt, dMax);
      t0 = t;
      var dd = dt / dT;

      var pos = canvas.getBoundingClientRect();
      if (pos.bottom <= 0 || pos.top >= window.innerHeight) return;

      var next = readSize();
      if (
        dpr !== (dpr = Math.min(window.devicePixelRatio || 1, 2)) ||
        W !== next.W ||
        H !== next.H
      ) {
        W = next.W;
        H = next.H;
        vMin = Math.min(W, H);
        aspect = W / H;
        renderer.setPixelRatio(dpr);
        renderer.setSize(W, H, false);
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }

      activePoints.forEach(function (p, idx) {
        var b = p.brightness;
        if (p.isActive && (b += (p.speed || 0.3) * (b + 0.05) * dd) > 1) {
          p.siblings.forEach(function (s, j) {
            if (activePoints.indexOf(s) > -1) return;
            s.speed = 3.7 / p.distances[j];
            if ((s.isActive = Math.random() > 0.6)) activePoints.push(s);
          });
          p.isActive = 0;
        } else if (!p.isActive && (b -= b * 0.056 * dd) < 0.005) {
          b = 0;
          activePoints.splice(idx, 1);
        }
        p.brightness = b;
        p.indexes.forEach(function (ii) {
          brights[ii] = b;
        });
      });

      points.forEach(function (p, pi) {
        var distSum = 0;
        p.siblings.forEach(function (s) {
          distSum += s.dr;
        });
        distSum = distSum / p.siblings.length - p.dr;
        p.f = -(activeF[pi] || 0) * 0.4 + distSum * k - p.dr * k0 * (1 + Math.abs(1 - p.r)) - p.v * fv;
        p.v += (p.f * dt) / m;
        p.r = 1 + p.dr;
        p.indexes.forEach(function (j) {
          var jj = j * 3;
          posArr[jj] = p.r * p.pos.x;
          posArr[jj + 1] = p.r * p.pos.y;
          posArr[jj + 2] = p.r * p.pos.z;
        });
      });

      points.forEach(function (p) {
        if (!p.v) return;
        p.dr += p.v * dt;
      });

      bGeometry.attributes.bright.needsUpdate = true;
      bGeometry.attributes.position.needsUpdate = true;
      camera.position.z += (posZ - camera.position.z) * 0.085 * dd;
      ro1 += roV1 * dd;
      ro2 += roV2 * dd;
      particles.rotation.set(0, 0, 0);
      particles.rotateY(ro2).rotateX(obliquity).rotateY(ro1);
      particles.rotation.y -= 0.0009;

      dx *= 1 - 0.03 * dd;
      dy *= 1 - 0.03 * dd;
      ro2 -= dx * 0.002;
      world.rotation.x -= dy * 0.002;
      var sro = (world.rotation.x *= 0.92);
      void sro;
      Net.applyMatrix(
        new THREE.Matrix4()
          .getInverse(particles.matrixWorld)
          .multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-dy * 0.003, -dx * 0.002, 0)))
          .multiply(particles.matrixWorld)
      );
      Earth.visible = false;
      scene.scale.set(0.33, 0.33, 0.65);
      cubeCamera.update(renderer, scene);
      Earth.visible = true;
      scene.scale.set(1, 1, 1);
      particles.matrixWorldNeedsUpdate = true;
      renderer.render(scene, camera);
      ready = 1;
    }

    requestAnimationFrame(animate);
  }

  function boot() {
    var wraps = document.querySelectorAll('[data-global-spotlight-globe]');
    if (!wraps.length) return;
    ensureThree()
      .then(function () {
        wraps.forEach(function (wrap) {
          var canvas = wrap.querySelector('.global-spotlight__earth-canvas');
          if (canvas && !canvas.dataset.globeInited) {
            canvas.dataset.globeInited = '1';
            initGlobalSpotlightGlobe(canvas);
          }
        });
      })
      .catch(function () {
        /* WebGL / CDN blocked: leave canvas empty */
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
