/* ===================================================
   PORTFOLIO — main.js
   Three.js 3D background + all site interactions
=================================================== */

// ===== THREE.JS 3D BACKGROUND =====
(function initThreeJS() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 30);

  // ----- Floating Geometric Shapes -----
  const shapes = [];
  const shapeGeometries = [
    new THREE.IcosahedronGeometry(1.2, 0),
    new THREE.OctahedronGeometry(1.2, 0),
    new THREE.TetrahedronGeometry(1.4, 0),
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
  ];
  const colors = [0x6c63ff, 0x00d4ff, 0xa855f7, 0x4f46e5, 0x06b6d4];

  for (let i = 0; i < 28; i++) {
    const geo = shapeGeometries[Math.floor(Math.random() * shapeGeometries.length)];
    const mat = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      wireframe: true,
      transparent: true,
      opacity: Math.random() * 0.25 + 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 70,
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 40 - 10,
    );
    const scale = Math.random() * 2 + 0.5;
    mesh.scale.setScalar(scale);
    mesh.userData = {
      speedX: (Math.random() - 0.5) * 0.003,
      speedY: (Math.random() - 0.5) * 0.003,
      speedZ: (Math.random() - 0.5) * 0.002,
      floatSpeed: Math.random() * 0.008 + 0.003,
      floatAmp: Math.random() * 1.5 + 0.5,
      baseY: mesh.position.y,
      phase: Math.random() * Math.PI * 2,
    };
    scene.add(mesh);
    shapes.push(mesh);
  }

  // ----- Particle Field -----
  const particleCount = 1800;
  const positions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80 - 20;

    const t = Math.random();
    // Interpolate between violet and cyan
    particleColors[i * 3] = 0.42 + t * (0.0 - 0.42);
    particleColors[i * 3 + 1] = 0.39 + t * (0.83 - 0.39);
    particleColors[i * 3 + 2] = 1.0;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  // ----- Grid Plane -----
  const gridHelper = new THREE.GridHelper(120, 40, 0x6c63ff, 0x6c63ff);
  gridHelper.material.opacity = 0.04;
  gridHelper.material.transparent = true;
  gridHelper.position.y = -20;
  scene.add(gridHelper);

  // ----- Mouse Parallax -----
  const mouse = { x: 0, y: 0 };
  const targetMouse = { x: 0, y: 0 };

  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // ----- Scroll Sync -----
  let scrollY = 0;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  }, { passive: true });

  // ----- Resize -----
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ----- Animation Loop -----
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth mouse lerp
    targetMouse.x += (mouse.x - targetMouse.x) * 0.04;
    targetMouse.y += (mouse.y - targetMouse.y) * 0.04;

    // Camera parallax
    camera.position.x = targetMouse.x * 3;
    camera.position.y = targetMouse.y * 2 - scrollY * 0.008;
    camera.lookAt(0, -scrollY * 0.008, 0);

    // Animate shapes
    shapes.forEach(mesh => {
      const d = mesh.userData;
      mesh.rotation.x += d.speedX;
      mesh.rotation.y += d.speedY;
      mesh.rotation.z += d.speedZ;
      mesh.position.y = d.baseY + Math.sin(t * d.floatSpeed * 60 + d.phase) * d.floatAmp;
    });

    // Slowly rotate particles
    particleSystem.rotation.y = t * 0.015;
    particleSystem.rotation.x = Math.sin(t * 0.05) * 0.08;

    // Grid drift
    gridHelper.rotation.y = t * 0.01;

    renderer.render(scene, camera);
  }

  animate();
})();


// ===== NAVBAR SCROLL & ACTIVE LINKS =====
(function initNav() {
  const navbar = document.getElementById('navbar');
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);

    // Highlight active nav link
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    links.forEach(l => {
      l.classList.toggle('active', l.dataset.section === current);
    });
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Smooth close on link click (mobile)
  links.forEach(l => l.addEventListener('click', () => navLinks.classList.remove('open')));
})();


// ===== ROLE TEXT ROTATOR =====
(function initRoleRotator() {
  const el = document.getElementById('role-rotator');
  if (!el) return;
  const roles = [
    'Secure Web Apps',
    'Ethical Hacking',
    'Penetration Tests',
    'Bug Bounty Hunting',
    'Security Research',
    'Full-Stack Tools',
  ];
  let i = 0, charI = 0, deleting = false, paused = false;

  function tick() {
    if (paused) return;
    const target = roles[i];
    if (!deleting) {
      el.textContent = target.slice(0, ++charI);
      if (charI === target.length) { deleting = true; paused = true; setTimeout(() => { paused = false; }, 2000); }
      setTimeout(tick, 65);
    } else {
      el.textContent = target.slice(0, --charI);
      if (charI === 0) { deleting = false; i = (i + 1) % roles.length; }
      setTimeout(tick, 35);
    }
  }
  tick();
})();


// ===== INTERSECTION OBSERVER — SKILL CARDS =====
(function initSkillObserver() {
  const cards = document.querySelectorAll('.skill-card');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add('visible'), +delay);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  cards.forEach(c => obs.observe(c));
})();


// ===== 3D TILT EFFECT ON CARDS =====
(function initTilt() {
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const cx = r.width / 2, cy = r.height / 2;
      const rotX = ((y - cy) / cy) * -8;
      const rotY = ((x - cx) / cx) * 8;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();


// ===== 3D ABOUT CARD TILT =====
(function initAboutTilt() {
  const card = document.getElementById('about-card');
  if (!card) return;
  const img = card.querySelector('.about-img-placeholder');

  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const cx = r.width / 2, cy = r.height / 2;
    const rotX = ((y - cy) / cy) * -12;
    const rotY = ((x - cx) / cx) * 12;
    img.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });

  card.addEventListener('mouseleave', () => {
    img.style.transform = '';
  });
})();


// ===== CONTACT FORM =====
(function initContactForm() {
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Sending...';

    setTimeout(() => {
      form.reset();
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Send Message';
      success.classList.add('show');
      setTimeout(() => success.classList.remove('show'), 4000);
    }, 1200);
  });
})();


// ===== SMOOTH SECTION ENTRANCE =====
(function initSectionReveal() {
  const style = document.createElement('style');
  style.textContent = `
    .reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.7s ease, transform 0.7s ease; }
    .reveal.in { opacity: 1; transform: translateY(0); }
  `;
  document.head.appendChild(style);

  const targets = document.querySelectorAll(
    '.section-label, .section-title, .about-intro, .about-body, .about-tags, .about-actions, ' +
    '.project-card, .contact-info, .contact-form'
  );
  targets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 4) * 0.08}s`;
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(el => obs.observe(el));
})();


// ===== CURSOR GLOW (desktop) =====
(function initCursorGlow() {
  if (window.innerWidth < 768) return;

  const glow = document.createElement('div');
  glow.style.cssText = `
    position: fixed; pointer-events: none; z-index: 9999;
    width: 350px; height: 350px; border-radius: 50%;
    background: radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: left 0.1s ease, top 0.1s ease;
    will-change: left, top;
  `;
  document.body.appendChild(glow);

  window.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  }, { passive: true });
})();


// ===== BACK TO TOP VISIBILITY =====
(function initBackTop() {
  const btn = document.getElementById('back-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.style.opacity = window.scrollY > 300 ? '1' : '0';
    btn.style.pointerEvents = window.scrollY > 300 ? 'auto' : 'none';
  }, { passive: true });
  btn.style.opacity = '0';
  btn.style.transition = 'opacity 0.3s ease';
})();
