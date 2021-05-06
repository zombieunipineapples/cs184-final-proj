  precision highp float;
  uniform sampler2D bufferTexture;
  uniform vec2  splatPos;
  uniform vec4  splatVal;
  uniform float splatRadius;
  uniform vec2 inverseCanvasSize;
  uniform bool isVelocity;

  void main()
  {
      vec2 coord = gl_FragCoord.xy * inverseCanvasSize;

      gl_FragColor = texture2D(bufferTexture, coord) * 0.999;
      vec2 dist = coord - splatPos;
      dist.x *= inverseCanvasSize.y / inverseCanvasSize.x;
      gl_FragColor += splatVal * smoothstep(inverseCanvasSize.x * splatRadius, 0.0, length(dist));
  }