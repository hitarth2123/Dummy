const curriculum = {
  course: 'B.Tech',
  semesters: [
    {
      number: 1,
      title: 'Foundation Semester',
      specializations: [{ name: 'Common Core', subjects: [
        { name: 'Engineering Mathematics I', topics: ['Differential Calculus', 'Integral Calculus', 'Matrices', 'Vector Algebra'] },
        { name: 'Engineering Physics', topics: ['Mechanics', 'Waves and Oscillations', 'Optics', 'Modern Physics'] },
        { name: 'Programming Fundamentals', topics: ['Problem Solving', 'C Programming', 'Functions', 'Arrays and Pointers'] },
        { name: 'Engineering Graphics', topics: ['Geometric Construction', 'Orthographic Projection', 'Isometric Projection', 'CAD Basics'] },
        { name: 'Communication Skills', topics: ['Technical Writing', 'Presentations', 'Professional Communication', 'Research Skills'] },
      ] }],
    },
    {
      number: 2,
      title: 'Computing Core',
      specializations: [{ name: 'Common Core', subjects: [
        { name: 'Engineering Mathematics II', topics: ['Differential Equations', 'Probability', 'Statistics', 'Transforms'] },
        { name: 'Data Structures', topics: ['Arrays and Linked Lists', 'Stacks and Queues', 'Trees', 'Graphs', 'Sorting and Searching'] },
        { name: 'Object Oriented Programming', topics: ['Classes and Objects', 'Inheritance', 'Polymorphism', 'Exception Handling'] },
        { name: 'Digital Logic Design', topics: ['Boolean Algebra', 'Combinational Circuits', 'Sequential Circuits', 'Memory Systems'] },
        { name: 'Discrete Mathematics', topics: ['Logic', 'Set Theory', 'Relations and Functions', 'Graph Theory'] },
      ] }],
    },
    {
      number: 3,
      title: 'Systems and Software',
      specializations: [{ name: 'Common Core', subjects: [
        { name: 'Database Management Systems', topics: ['ER Modeling', 'Relational Algebra', 'Normalization', 'Transactions and ACID', 'SQL'] },
        { name: 'Operating Systems', topics: ['Processes and Threads', 'CPU Scheduling', 'Deadlocks', 'Memory Management', 'File Systems'] },
        { name: 'Computer Organization', topics: ['CPU Architecture', 'Instruction Sets', 'Pipelining', 'Cache Memory', 'I/O Systems'] },
        { name: 'Theory of Computation', topics: ['Finite Automata', 'Regular Languages', 'Context Free Grammars', 'Turing Machines'] },
        { name: 'Software Engineering', topics: ['SDLC Models', 'Requirements Engineering', 'Agile Methods', 'Software Testing', 'Design Patterns'] },
      ] }],
    },
    {
      number: 4,
      title: 'Networks and Applications',
      specializations: [{ name: 'Common Core', subjects: [
        { name: 'Computer Networks', topics: ['OSI and TCP/IP Models', 'Routing', 'Transport Protocols', 'Network Security Basics', 'Wireless Networks'] },
        { name: 'Web Technologies', topics: ['HTML and CSS', 'JavaScript', 'REST APIs', 'Authentication', 'Web Performance'] },
        { name: 'Design and Analysis of Algorithms', topics: ['Complexity Analysis', 'Divide and Conquer', 'Greedy Algorithms', 'Dynamic Programming', 'Graph Algorithms'] },
        { name: 'Probability and Statistics', topics: ['Random Variables', 'Distributions', 'Hypothesis Testing', 'Regression', 'Data Interpretation'] },
        { name: 'Professional Ethics', topics: ['Engineering Responsibility', 'Privacy', 'Intellectual Property', 'Sustainable Technology'] },
      ] }],
    },
    {
      number: 5,
      title: 'Advanced Computer Science',
      specializations: [{ name: 'Common Core', subjects: [
        { name: 'Artificial Intelligence', topics: ['Intelligent Agents', 'Search Algorithms', 'Knowledge Representation', 'Machine Learning Basics'] },
        { name: 'Compiler Design', topics: ['Lexical Analysis', 'Parsing', 'Syntax Directed Translation', 'Code Optimization'] },
        { name: 'Cloud Computing', topics: ['Virtualization', 'Cloud Service Models', 'Containers', 'Cloud Storage', 'Serverless Computing'] },
        { name: 'Distributed Systems', topics: ['Distributed Architectures', 'Consensus', 'Replication', 'Distributed Transactions'] },
        { name: 'Computer Graphics', topics: ['2D Transformations', '3D Modeling', 'Rendering', 'Lighting', 'Animation'] },
      ] }],
    },
    {
      number: 6,
      title: 'Specialization I',
      specializations: [
        { name: 'Cybersecurity', subjects: [
          { name: 'Network Security', topics: ['Threat Modeling', 'Firewalls', 'Intrusion Detection', 'Secure Protocols', 'Zero Trust'] },
          { name: 'Ethical Hacking', topics: ['Reconnaissance', 'Vulnerability Assessment', 'Web Application Testing', 'Exploitation', 'Reporting'] },
          { name: 'Cryptography', topics: ['Classical Ciphers', 'Symmetric Encryption', 'Public Key Cryptography', 'Hashing', 'Digital Signatures'] },
          { name: 'Cyber Law and Digital Forensics', topics: ['Digital Evidence', 'Forensic Imaging', 'Incident Response', 'Privacy Law', 'Cybercrime'] },
        ] },
        { name: 'AI and ML', subjects: [
          { name: 'Machine Learning', topics: ['Supervised Learning', 'Unsupervised Learning', 'Feature Engineering', 'Model Evaluation', 'Ensemble Methods'] },
          { name: 'Deep Learning', topics: ['Neural Networks', 'CNNs', 'RNNs', 'Transformers', 'Model Regularization'] },
          { name: 'Natural Language Processing', topics: ['Text Preprocessing', 'Embeddings', 'Sequence Models', 'Attention', 'Evaluation Metrics'] },
          { name: 'Data Engineering', topics: ['Data Pipelines', 'ETL', 'Data Warehousing', 'Spark', 'Data Quality'] },
        ] },
        { name: 'AR/VR', subjects: [
          { name: 'Extended Reality Development', topics: ['XR Fundamentals', 'Unity Scenes', 'Interaction Design', 'Input Systems', 'XR Performance'] },
          { name: '3D Modeling and Animation', topics: ['Meshes', 'Materials', 'Rigging', 'Keyframe Animation', 'Asset Optimization'] },
          { name: 'Computer Vision', topics: ['Image Processing', 'Feature Detection', 'Object Tracking', 'Depth Sensing', 'Pose Estimation'] },
          { name: 'Human Computer Interaction', topics: ['UX for XR', 'Spatial Interaction', 'Usability Testing', 'Accessibility', 'Presence'] },
        ] },
      ],
    },
    {
      number: 7,
      title: 'Specialization II',
      specializations: [
        { name: 'Cybersecurity', subjects: [
          { name: 'Cloud and Application Security', topics: ['Secure SDLC', 'Cloud IAM', 'Container Security', 'API Security', 'DevSecOps'] },
          { name: 'Security Operations', topics: ['SIEM', 'Threat Intelligence', 'Security Monitoring', 'Incident Handling', 'Security Metrics'] },
          { name: 'Malware Analysis', topics: ['Static Analysis', 'Dynamic Analysis', 'Reverse Engineering', 'Persistence', 'Sandboxing'] },
          { name: 'Security Governance', topics: ['Risk Management', 'Security Policies', 'Compliance', 'Auditing', 'Business Continuity'] },
        ] },
        { name: 'AI and ML', subjects: [
          { name: 'Reinforcement Learning', topics: ['Markov Decision Processes', 'Value Methods', 'Policy Methods', 'Exploration', 'Multi Agent Learning'] },
          { name: 'Generative AI', topics: ['Language Models', 'Prompt Engineering', 'RAG', 'Fine Tuning', 'AI Safety'] },
          { name: 'Computer Vision and Robotics', topics: ['Image Classification', 'Object Detection', 'SLAM', 'Path Planning', 'Robot Perception'] },
          { name: 'MLOps', topics: ['Experiment Tracking', 'Model Deployment', 'Monitoring', 'Data Drift', 'Responsible ML'] },
        ] },
        { name: 'AR/VR', subjects: [
          { name: 'Advanced Virtual Reality', topics: ['Immersive Environments', 'Physics Interaction', 'Multiplayer XR', 'Haptics', 'Comfort Design'] },
          { name: 'Augmented Reality', topics: ['World Tracking', 'Image Anchors', 'Spatial Mapping', 'Occlusion', 'Mobile AR'] },
          { name: 'XR Game Design', topics: ['Game Loops', 'Level Design', 'XR Storytelling', 'Audio Design', 'Playtesting'] },
          { name: 'Real Time Rendering', topics: ['Shaders', 'Lighting Pipelines', 'Post Processing', 'GPU Optimization', 'Visual Effects'] },
        ] },
      ],
    },
    {
      number: 8,
      title: 'Capstone and Industry',
      specializations: [
        { name: 'Cybersecurity', subjects: [
          { name: 'Advanced Cybersecurity Project', topics: ['Project Scoping', 'Security Architecture', 'Implementation', 'Validation', 'Security Presentation'] },
          { name: 'Cybersecurity Internship', topics: ['Workplace Practice', 'Security Documentation', 'Stakeholder Communication', 'Professional Conduct'] },
          { name: 'Security Research Seminar', topics: ['Literature Review', 'Research Methodology', 'Threat Trends', 'Technical Writing'] },
        ] },
        { name: 'AI and ML', subjects: [
          { name: 'Advanced AI Project', topics: ['Problem Framing', 'Dataset Design', 'Model Development', 'Evaluation', 'Deployment'] },
          { name: 'AI and ML Internship', topics: ['Experiment Design', 'Team Delivery', 'Model Documentation', 'Business Communication'] },
          { name: 'AI Research Seminar', topics: ['Paper Reading', 'Reproducibility', 'Responsible AI', 'Technical Presentation'] },
        ] },
        { name: 'AR/VR', subjects: [
          { name: 'XR Capstone Project', topics: ['Experience Design', 'Prototype Development', 'Interaction Testing', 'Performance Tuning', 'Demo Day'] },
          { name: 'XR Industry Internship', topics: ['Production Workflow', 'Asset Pipeline', 'Team Collaboration', 'Product Documentation'] },
          { name: 'Immersive Technology Seminar', topics: ['XR Research', 'Emerging Devices', 'Ethics of Immersion', 'Portfolio Presentation'] },
        ] },
      ],
    },
  ],
};

const getSemester = (number) => curriculum.semesters.find((semester) => semester.number === Number(number));
const flattenSubjects = (semester) => (semester?.specializations || []).flatMap((specialization) => specialization.subjects.map((subject) => ({ ...subject, specialization: specialization.name })));

module.exports = { curriculum, getSemester, flattenSubjects };
