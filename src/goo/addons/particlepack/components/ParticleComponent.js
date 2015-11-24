define([
	'goo/math/Matrix3',
	'goo/math/Vector3',
	'goo/math/Vector',
	'goo/math/Vector4',
	'goo/renderer/MeshData',
	'goo/renderer/Material',
	'goo/math/MathUtils',
	'goo/entities/components/MeshRendererComponent',
	'goo/entities/components/Component',
	'goo/renderer/Texture',
	'goo/renderer/Shader',
	'goo/math/Transform',
	'goo/addons/particlepack/Particle',
	'goo/renderer/Renderer',
	'goo/shapes/Quad'
], function (
	Matrix3,
	Vector3,
	Vector,
	Vector4,
	MeshData,
	Material,
	MathUtils,
	MeshRendererComponent,
	Component,
	Texture,
	Shader,
	Transform,
	Particle,
	Renderer,
	Quad
) {
	'use strict';

	var tmpGravity = new Vector3();

	function numberToGLSL(n) {
		return (n + '').indexOf('.') === -1 ? n + '.0' : n + '';
	}

	/**
	 */
	function ParticleComponent(options) {
		options = options || {};
		Component.apply(this, arguments);
		this.type = ParticleComponent.type;

		this._system = null;
		this._entity = null;

		this.material = new Material({
			defines: {
				START_SCALE: '1.0'
			},
			attributes: {
				vertexPosition: MeshData.POSITION,
				timeInfo: 'TIME_INFO',
				startPos: 'START_POS',
				startDir: 'START_DIR',
				vertexUV0: MeshData.TEXCOORD0
			},
			uniforms: {
				textureTileInfo: [1, 1, 1, 0], // tilesX, tilesY, cycles over lifetime, unused
				viewMatrix: Shader.VIEW_MATRIX,
				projectionMatrix: Shader.PROJECTION_MATRIX,
				viewProjectionMatrix: Shader.VIEW_PROJECTION_MATRIX,
				worldMatrix: Shader.WORLD_MATRIX,
				particleTexture: 'PARTICLE_TEXTURE',
				cameraPosition: Shader.CAMERA,
				time: 0,
				gravity: [0, 0, 0],
				uColor: [1, 1, 1, 1],
				alphakill: 0
			},
			vshader: [
				'attribute vec3 vertexPosition;',
				'attribute vec2 vertexUV0;',
				'attribute vec4 timeInfo;',
				'attribute vec3 startPos;',
				'attribute vec3 startDir;',

				'uniform vec4 textureTileInfo;',
				'uniform mat4 viewMatrix;',
				'uniform mat4 projectionMatrix;',
				'uniform mat4 viewProjectionMatrix;',
				'uniform mat4 worldMatrix;',
				'uniform vec3 cameraPosition;',
				'uniform float time;',
				'uniform vec3 gravity;',

				'uniform vec4 uColor;',
				'varying vec4 color;',

				'varying vec2 coords;',

				'vec3 getPosition(float t, vec3 pos, vec3 dir, vec3 g){',
				'    return pos + dir * t + 0.5 * t * t * g;',
				'}',

				'float getScale(float t){',
				'    return clamp(1.0 - t, 0.0, 1.0) * START_SCALE;',
				'}',

				'float getAngle(float t){',
				'    return t;',
				'}',

				'mat4 rotationMatrix(vec3 axis, float angle){',
				'    axis = normalize(axis);',
				'    float s = sin(angle);',
				'    float c = cos(angle);',
				'    float oc = 1.0 - c;',
				'    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,',
				'    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,',
				'    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,',
				'    0.0,                                0.0,                                0.0,                                1.0);',
				'}',

				'void main(void) {',
				'    color = uColor;',

				'    float lifeTime = timeInfo.x;',
				'    float active = timeInfo.y;',
				'    float emitTime = timeInfo.w;',
				'    float age = time * active - emitTime;',
				'    float ageNoMod = time * active - emitTime;',

				'    #ifdef LOOP',
				'    age = mod(age, lifeTime);',
				'    #endif',

				'    float unitAge = age / lifeTime;',

				'    float tileX = floor(mod(textureTileInfo.x * textureTileInfo.y * unitAge, textureTileInfo.x));',
				'    float tileY = floor(mod(textureTileInfo.y * unitAge, textureTileInfo.y));',
				'    vec2 texOffset = vec2(tileX, tileY) / textureTileInfo.xy;',
				'    coords = vertexUV0 / textureTileInfo.xy + texOffset;',

				'    float rotation = getAngle(age);',
				'    float c = cos(rotation);',
				'    float s = sin(rotation);',
				'    mat3 spinMatrix = mat3(c, s, 0, -s, c, 0, 0, 0, 1);',
				// Particle should show if lifeTime >= age > 0 and within life span
				'    active *= step(0.0, ageNoMod) * step(0.0, age) * step(-lifeTime, -age);',
				'    vec3 position = getPosition(age, startPos, startDir, gravity);',
				'    #ifdef BILLBOARD',
				'    vec2 offset = ((spinMatrix * vertexPosition)).xy * getScale(unitAge) * active;',
				'    mat4 matPos = worldMatrix * mat4(vec4(0),vec4(0),vec4(0),vec4(position,0));',
				'    gl_Position = viewProjectionMatrix * (worldMatrix + matPos) * vec4(0, 0, 0, 1) + projectionMatrix * vec4(offset.xy, 0, 0);',
				'    #else',
				'    mat4 rot = rotationMatrix(normalize(vec3(sin(emitTime*5.0),cos(emitTime*1234.0),sin(emitTime))),rotation);',
				'    gl_Position = viewProjectionMatrix * worldMatrix * (rot * vec4(getScale(unitAge) * active * vertexPosition, 1.0) + vec4(position,0.0));',
				'    #endif',
				'}'
			].join('\n'),
			fshader: [
				'uniform sampler2D particleTexture;',
				'uniform float alphakill;',

				'varying vec4 color;',
				'varying vec2 coords;',

				'void main(void){',
				'#ifdef PARTICLE_TEXTURE',
				'    vec4 col = color * texture2D(particleTexture, coords);',
				'#else',
				'    vec4 col = color;',
				'#endif',
				'    if (col.a <= alphakill) discard;',
				'    gl_FragColor = col;',
				'}'
			].join('\n')
		});
		this.material.cullState.enabled = false;
		this.material.uniforms.textureTileInfo = [1, 1, 1, 0];

		this.time = 0;

		/**
		 * @type {Vector3}
		 */
		this.gravity = new Vector3();
		if (options.gravity) {
			this.gravity.copy(options.gravity);
		}

		this.startColor = new Vector4(1, 1, 1, 1);
		this.particles = [];
		this.unsortedParticles = []; // Same as particles but unsorted
		this.shapeType = options.shapeType !== undefined ? options.shapeType : 'sphere';
		this.duration = options.duration !== undefined ? options.duration : 10;
		this.emitterRadius = options.emitterRadius !== undefined ? options.emitterRadius : 1;
		this.emitterExtents = options.emitterExtents !== undefined ? options.emitterExtents.clone() : new Vector3(1, 1, 1);
		this.shapeRadius = options.shapeRadius !== undefined ? options.shapeRadius : 1;
		this.coneAngle = options.coneAngle !== undefined ? options.coneAngle : 10;
		this.localSpace = options.localSpace !== undefined ? options.localSpace : true;
		this._startSpeed = options.startSpeed !== undefined ? options.startSpeed : 5;
		this._maxParticles = options.maxParticles !== undefined ? options.maxParticles : 1000;
		this.emissionRate = options.emissionRate !== undefined ? options.emissionRate : 10;
		this.startLifeTime = options.startLifeTime !== undefined ? options.startLifeTime : 5;
		this.renderQueue = options.renderQueue !== undefined ? options.renderQueue : 3010;
		this.alphakill = options.alphakill !== undefined ? options.alphakill : 0;
		this.loop = options.loop !== undefined ? options.loop : true;
		this.preWarm = options.preWarm !== undefined ? options.preWarm : true;
		this.blending = options.blending !== undefined ? options.blending : true;
		this.depthWrite = options.depthWrite !== undefined ? options.depthWrite : true;
		this.depthTest = options.depthTest !== undefined ? options.depthTest : true;
		this.textureTilesX = options.textureTilesX !== undefined ? options.textureTilesX : 1;
		this.textureTilesY = options.textureTilesY !== undefined ? options.textureTilesY : 1;
		this.startSize = options.startSize !== undefined ? options.startSize : 1;
		this.sortMode = options.sortMode !== undefined ? options.sortMode : ParticleComponent.SORT_NONE;
		this.mesh = options.mesh !== undefined ? options.mesh : new Quad(1, 1, 1, 1);
		this.billboard = options.billboard !== undefined ? options.billboard : true;
		if (options.texture) {
			this.texture = options.texture;
		}

		this.nextEmitParticle = 0;
	}
	ParticleComponent.prototype = Object.create(Component.prototype);
	ParticleComponent.prototype.constructor = ParticleComponent;

	ParticleComponent.type = 'ParticleComponent';

	ParticleComponent.SORT_NONE = 1;
	ParticleComponent.SORT_CAMERA_DISTANCE = 2;

	Object.defineProperties(ParticleComponent.prototype, {
		billboard: {
			get: function () {
				return this.material.shader.hasDefine('BILLBOARD');
			},
			set: function (value) {
				var shader = this.material.shader;
				if (value) {
					shader.setDefine('BILLBOARD', true);
				} else {
					shader.removeDefine('BILLBOARD');
				}
			}
		},
		loop: {
			get: function () {
				return this.material.shader.hasDefine('LOOP');
			},
			set: function (value) {
				if (value) {
					this.material.shader.setDefine('LOOP', true);
				} else {
					this.material.shader.removeDefine('LOOP');
				}
			}
		},
		blending: {
			get: function () {
				return this.material.blendState.blending;
			},
			set: function (value) {
				this.material.blendState.blending = value;
			}
		},
		localSpace: {
			get: function () {
				if (!this.entity) {
					// Didn't initialize yet
					return this._localSpace;
				}
				return !!(this.entity.transformComponent.parent && this.entity.transformComponent.parent.entity.name !== 'root');
			},
			set: function (value) {
				if (!this.entity) {
					// Didn't initialize yet
					this._localSpace = value;
					return;
				}
				var entity = this.entity;
				var hasParent = this.localSpace;
				if (!value && hasParent) {
					entity.transformComponent.parent.detachChild(entity.transformComponent);
				} else if (value && !hasParent) {
					entity.transformComponent.parent.attachChild(this.entity.transformComponent);
				}
			}
		},
		depthTest: {
			get: function () {
				return this.material.depthState.enabled;
			},
			set: function (value) {
				this.material.depthState.enabled = value;
			}
		},
		alphakill: {
			get: function () {
				return this.material.uniforms.alphakill;
			},
			set: function (value) {
				this.material.uniforms.alphakill = value;
			}
		},
		texture: {
			get: function () {
				return this.material.getTexture('PARTICLE_TEXTURE');
			},
			set: function (value) {
				this.material.setTexture('PARTICLE_TEXTURE', value);
				var shader = this.material.shader;
				if (value) {
					shader.setDefine('PARTICLE_TEXTURE', true);
				} else {
					shader.removeDefine('PARTICLE_TEXTURE');
				}
			}
		},
		textureTilesX: {
			get: function () {
				return this.material.uniforms.textureTileInfo[0];
			},
			set: function (value) {
				this.material.uniforms.textureTileInfo[0] = value;
			}
		},
		textureTilesY: {
			get: function () {
				return this.material.uniforms.textureTileInfo[1];
			},
			set: function (value) {
				this.material.uniforms.textureTileInfo[1] = value;
			}
		},
		depthWrite: {
			get: function () {
				return this.material.depthState.write;
			},
			set: function (value) {
				this.material.depthState.write = value;
			}
		},
		renderQueue: {
			get: function () {
				return this.material.renderQueue;
			},
			set: function (value) {
				this.material.renderQueue = value;
			}
		},
		startSpeed: {
			get: function () {
				return this._startSpeed;
			},
			set: function (value) {
				if (this._startSpeed !== value) {
					this._startSpeed = value;
					this.updateVertexData();
				}
			}
		},
		startSize: {
			get: function () {
				return Number(this.material.shader.defines.START_SCALE);
			},
			set: function (value) {
				this.material.shader.setDefine('START_SCALE', numberToGLSL(value));
			}
		},
		maxParticles: {
			get: function () {
				return this.meshData ? this.meshData.vertexCount / this.mesh.vertexCount : this._maxParticles;
			},
			set: function (value) {
				if (value * this.mesh.vertexCount !== this.meshData.vertexCount) {
					this.meshData.vertexCount = value * this.mesh.vertexCount;
					this.meshData.indexCount = value * this.mesh.indexCount;
					this.meshData.rebuildData();
					this.updateParticles();
					this.updateVertexData();
				}
			}
		}
	});

	var invRot = new Matrix3();
	ParticleComponent.prototype.updateUniforms = function () {
		var uniforms = this.material.uniforms;

		// Gravity in local space
		tmpGravity.copy(this.gravity);
		invRot.copy(this.entity.transformComponent.worldTransform.rotation).invert();
		tmpGravity.applyPost(invRot);
		uniforms.gravity = uniforms.gravity || [];
		uniforms.gravity[0] = tmpGravity.x;
		uniforms.gravity[1] = tmpGravity.y;
		uniforms.gravity[2] = tmpGravity.z;

		// Color
		var d = this.startColor;
		uniforms.uColor = uniforms.uColor || [];
		uniforms.uColor[0] = d.x;
		uniforms.uColor[1] = d.y;
		uniforms.uColor[2] = d.z;
		uniforms.uColor[3] = d.w;

		uniforms.time = this.time;
	};

	ParticleComponent.prototype.updateParticles = function () {
		var particles = this.particles;
		var unsortedParticles = this.unsortedParticles;
		var maxParticles = this.maxParticles;
		while (particles.length < maxParticles) {
			var particle = new Particle(this);
			particles.push(particle);
			unsortedParticles.push(particle);
		}
		while (particles.length > maxParticles) {
			var particle = particles.pop();
			unsortedParticles.splice(unsortedParticles.indexOf(particle), 1);
		}
	};

	ParticleComponent.prototype.updateVertexData = function () {
		var meshData = this.meshData;
		var maxParticles = this.maxParticles;
		var i, j;

		var offset = meshData.getAttributeBuffer(MeshData.TEXCOORD0);
		var pos = meshData.getAttributeBuffer(MeshData.POSITION);
		var indices = meshData.getIndexBuffer();

		var mesh = this.mesh;
		var meshIndices = mesh.getIndexBuffer();
		var meshPos = mesh.getAttributeBuffer(MeshData.POSITION);
		var meshUV = mesh.getAttributeBuffer(MeshData.TEXCOORD0);
		var meshVertexCount = mesh.vertexCount;
		for (i = 0; i < maxParticles; i++) {
			for (var j = 0; j < meshUV.length; j++) {
				offset[i * meshUV.length + j] = meshUV[j];
			}
			for (var j = 0; j < meshPos.length; j++) {
				pos[i * meshPos.length + j] = meshPos[j];
			}
			for (var j = 0; j < meshIndices.length; j++) {
				indices[i * meshIndices.length + j] = meshIndices[j] + i * meshVertexCount;
			}
		}

		meshData.setAttributeDataUpdated(MeshData.TEXCOORD0);
		meshData.setAttributeDataUpdated(MeshData.POSITION);

		// Time info
		var timeInfo = meshData.getAttributeBuffer('TIME_INFO');
		for (i = 0; i < maxParticles; i++) {
			var particle = this.particles[i];
			particle.active = 1;
			particle.lifeTime = this.startLifeTime;

			if (this.localSpace) {

				if(this.preWarm){
					// Already emitted, negative time
					particle.emitTime = -i / this.emissionRate;
				} else {
					// Emit in the future, positive time
					particle.emitTime = i / this.emissionRate;
				}

				if (this.loop) {
					particle.active = i < this.duration * this.emissionRate ? 0 : 1;
				}

			} else {
				// Set all particles to be active but already dead - ready to be re-emitted at any point
				particle.active = 1;
				particle.emitTime = -2 * particle.lifeTime;
			}

			for (j = 0; j < meshVertexCount; j++) {
				timeInfo[meshVertexCount * 4 * i + j * 4 + 0] = particle.lifeTime;
				timeInfo[meshVertexCount * 4 * i + j * 4 + 1] = particle.active;
				timeInfo[meshVertexCount * 4 * i + j * 4 + 2] = particle.lifeTime;
				timeInfo[meshVertexCount * 4 * i + j * 4 + 3] = particle.emitTime;
			}
		}
		meshData.setAttributeDataUpdated('TIME_INFO');

		// Start position
		var startPos = meshData.getAttributeBuffer('START_POS');
		var startDir = meshData.getAttributeBuffer('START_DIR');

		for (i = 0; i < maxParticles; i++) {
			var particle = this.particles[i];
			var pos = particle.startPosition;
			var dir = particle.startDirection;

			this._generateLocalPositionAndDirection(pos, dir);

			for (j = 0; j < meshVertexCount; j++) {
				startPos[meshVertexCount * 3 * i + j * 3 + 0] = pos.x;
				startPos[meshVertexCount * 3 * i + j * 3 + 1] = pos.y;
				startPos[meshVertexCount * 3 * i + j * 3 + 2] = pos.z;

				startDir[meshVertexCount * 3 * i + j * 3 + 0] = dir.x;
				startDir[meshVertexCount * 3 * i + j * 3 + 1] = dir.y;
				startDir[meshVertexCount * 3 * i + j * 3 + 2] = dir.z;
			}
		}
		meshData.setAttributeDataUpdated('START_POS');
		meshData.setAttributeDataUpdated('START_DIR');
	};

	ParticleComponent.prototype._generateLocalPositionAndDirection = function (position, direction) {
		// Default
		direction.setDirect(0, this.startSpeed, 0);

		if (this.shapeType === 'cube') {
			position.setDirect(
				Math.random() - 0.5,
				Math.random() - 0.5,
				Math.random() - 0.5
			);
		} else if (this.shapeType === 'sphere') {
			var theta = Math.acos(2 * Math.random() - 1);
			var phi = 2 * Math.PI * Math.random();
			var r = this.emitterRadius;
			position.setDirect(
				r * Math.cos(phi) * Math.sin(theta),
				r * Math.cos(theta),
				r * Math.sin(phi) * Math.sin(theta)
			);
			direction.setDirect(
				Math.cos(phi) * Math.sin(theta),
				Math.cos(theta),
				Math.sin(phi) * Math.sin(theta)
			).normalize().scale(this.startSpeed);
		} else if (this.shapeType === 'cone') {
			var phi = 2 * Math.PI * Math.random();
			var y = Math.random();
			var rad = this.shapeRadius * Math.random() * y;
			position.setDirect(
				rad * Math.cos(phi),
				y,
				rad * Math.sin(phi)
			);
			direction.copy(position).normalize().scale(this.startSpeed);
			position.y -= 0.5;
		}
	};

	ParticleComponent.prototype.emitOne = function (position, direction) {
		var meshData = this.meshData;
		var startPos = meshData.getAttributeBuffer('START_POS');
		var startDir = meshData.getAttributeBuffer('START_DIR');
		var timeInfo = meshData.getAttributeBuffer('TIME_INFO');

		// Get the last emitted particle
		var i = this.nextEmitParticle = (this.nextEmitParticle + 1) % this.maxParticles;
		var particle = this.unsortedParticles[i];
		particle.emitTime = this.time; // Emitting NOW
		particle.startPosition.copy(position);
		particle.startDirection.copy(direction);
		particle.active = true;

		var meshVertexCount = this.mesh.vertexCount;

		for (var j = 0; j < meshVertexCount; j++) {
			timeInfo[meshVertexCount * 4 * i + j * 4 + 3] = particle.emitTime;

			startPos[meshVertexCount * 3 * i + j * 3 + 0] = particle.startPosition.x;
			startPos[meshVertexCount * 3 * i + j * 3 + 1] = particle.startPosition.y;
			startPos[meshVertexCount * 3 * i + j * 3 + 2] = particle.startPosition.z;

			startDir[meshVertexCount * 3 * i + j * 3 + 0] = particle.startDirection.x;
			startDir[meshVertexCount * 3 * i + j * 3 + 1] = particle.startDirection.y;
			startDir[meshVertexCount * 3 * i + j * 3 + 2] = particle.startDirection.z;
		}

		meshData.setAttributeDataUpdated('START_POS');
		meshData.setAttributeDataUpdated('START_DIR');
		meshData.setAttributeDataUpdated('TIME_INFO');
	};

	var tmpWorldPos = new Vector3();
	ParticleComponent.prototype.sortParticles = function () {
		if (this.sortMode === ParticleComponent.SORT_NONE) {
			return;
		}

		var particles = this.particles;

		// Update sort values
		for (var i = 0; i < particles.length; i++) {
			var particle = particles[i];
			particle.sortValue = -particle.getWorldPosition(tmpWorldPos).dot(Renderer.mainCamera._direction);
		}

		// Insertion sort in-place
		var a = particles;
		for (var i = 1, l = a.length; i < l; i++) {
			var v = a[i];
			for (var j = i - 1; j >= 0; j--) {
				if (a[j].sortValue <= v.sortValue) {
					break;
				}
				a[j + 1] = a[j];
			}
			a[j + 1] = v;
		}

		// Update buffers
		var meshData = this.meshData;
		var startPos = meshData.getAttributeBuffer('START_POS');
		var startDir = meshData.getAttributeBuffer('START_DIR');
		var timeInfo = meshData.getAttributeBuffer('TIME_INFO');
		for (var i = 0; i < particles.length; i++) {
			var particle = particles[i];
			var emitTime = particle.emitTime;
			var pos = particle.startPosition;
			var dir = particle.startDirection;
			var meshVertexCount = this.mesh.meshVertexCount;
			for (var j = 0; j < meshVertexCount; j++) {
				timeInfo[meshVertexCount * 4  * i + j * 4 + 3] = emitTime;

				startPos[meshVertexCount * 3 * i + j * 3 + 0] = pos.x;
				startPos[meshVertexCount * 3 * i + j * 3 + 1] = pos.y;
				startPos[meshVertexCount * 3 * i + j * 3 + 2] = pos.z;

				startDir[meshVertexCount * 3 * i + j * 3 + 0] = dir.x;
				startDir[meshVertexCount * 3 * i + j * 3 + 1] = dir.y;
				startDir[meshVertexCount * 3 * i + j * 3 + 2] = dir.z;
			}
		}
		meshData.setAttributeDataUpdated('START_POS');
		meshData.setAttributeDataUpdated('START_DIR');
		meshData.setAttributeDataUpdated('TIME_INFO');
	};

	var tmpPos = new Vector3();
	var tmpDir = new Vector3();
	ParticleComponent.prototype.process = function (tpf) {
		this.lastTime = this.time;
		this.time += tpf;
		if (this.loop && this.time > this.duration) {
			this.time %= this.duration;
		}
		this.updateUniforms();

		this.sortParticles();

		// Emit according to emit rate
		if (!this.localSpace) {
			var numToEmit = Math.floor(this.time * this.emissionRate) - Math.floor(this.lastTime * this.emissionRate);
			for (var i = 0; i < numToEmit; i++) {
				// get pos and direction from the shape
				this._generateLocalPositionAndDirection(tmpPos, tmpDir);

				// Transform to world space
				tmpPos.applyPostPoint(this._entity.transformComponent.worldTransform.matrix);
				tmpDir.applyPost(this._entity.transformComponent.worldTransform.rotation);

				// Emit
				this.emitOne(tmpPos, tmpDir);
			}
		}
	};

	ParticleComponent.prototype.destroy = function () {
		if (this.entity.parent) {
			this._entity.detachChild(this.entity);
		}
		this.entity.removeFromWorld();
	};

	/**
	 * @private
	 * @param entity
	 */
	ParticleComponent.prototype.attached = function (entity) {
		this._entity = entity;
		this._system = entity._world.getSystem('PhysicsSystem');

		var maxParticles = this.maxParticles;
		for (var i = 0; i < maxParticles; i++) {
			var particle = new Particle(this);
			this.particles.push(particle);
			this.unsortedParticles.push(particle);
		}

		var attributeMap = MeshData.defaultMap([
			MeshData.POSITION,
			MeshData.TEXCOORD0
		]);
		attributeMap.TIME_INFO = MeshData.createAttribute(4, 'Float');
		attributeMap.START_POS = MeshData.createAttribute(3, 'Float');
		attributeMap.START_DIR = MeshData.createAttribute(3, 'Float');
		var meshData = new MeshData(attributeMap, maxParticles * this.mesh.vertexCount, maxParticles * this.mesh.indexCount);
		meshData.vertexData.setDataUsage('DynamicDraw');
		this.meshData = meshData;

		var meshEntity = this.entity = this._entity._world.createEntity(meshData);
		meshEntity.set(new MeshRendererComponent(this.material));
		meshEntity.name = 'ParticleSystem';
		meshEntity.meshRendererComponent.cullMode = 'Never'; // TODO: cull with approx bounding sphere
		meshEntity.addToWorld();
		if (this._localSpace) {
			console.log('attaching child')
			this._entity.transformComponent.attachChild(meshEntity.transformComponent, false);
		}

		this.updateVertexData();
	};

	/**
	 * @private
	 * @param entity
	 */
	ParticleComponent.prototype.detached = function (entity) {
		this.entity.clearComponent('MeshDataComponent');
		this._entity = undefined;
		this._system = undefined;
		this.unsortedParticles.length = this.particles.length = 0;
		this.entity.removeFromWorld();
		this.entity = null;
	};

	/**
	 * @returns RigidBodyComponent
	 */
	ParticleComponent.prototype.clone = function () {
		return new ParticleComponent({
			gravity: this.gravity,
			startColor: this.startColor,
			shapeType: this.shapeType,
			textureTilesX: this.textureTilesX,
			textureTilesY: this.textureTilesY,
			particles: this.particles,
			duration: this.duration,
			emitterRadius: this.emitterRadius,
			shapeRadius: this.shapeRadius,
			coneAngle: this.coneAngle,
			localSpace: this.localSpace,
			emissionRate: this.emissionRate,
			startLifeTime: this.startLifeTime,
			renderQueue: this.renderQueue,
			alphakill: this.alphakill,
			loop: this.loop
		});
	};

	return ParticleComponent;
});