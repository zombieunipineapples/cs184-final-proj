precision highp float;
uniform sampler2D velocityTexture;
uniform sampler2D pressureTexture;
uniform vec2 inverseCanvasSize;

void main()
{
    vec2 coord = gl_FragCoord.xy * inverseCanvasSize;
    
    float diffX = texture2D(pressureTexture, coord + vec2(1.0, 0.0) * inverseCanvasSize).x
              - texture2D(pressureTexture, coord - vec2(1.0, 0.0) * inverseCanvasSize).x;
    float diffY = texture2D(pressureTexture, coord + vec2(0.0, 1.0) * inverseCanvasSize).x
              - texture2D(pressureTexture, coord - vec2(0.0, 1.0) * inverseCanvasSize).x;
    
    gl_FragColor = texture2D(velocityTexture, coord);
    gl_FragColor.xy -= vec2(diffX, diffY);
}