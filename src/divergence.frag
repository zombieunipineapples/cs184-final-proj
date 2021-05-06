precision highp float;
uniform sampler2D velocityTexture;
uniform vec2 inverseCanvasSize;

void main()
{
    vec2 coord = gl_FragCoord.xy * inverseCanvasSize;
    
    float rX = texture2D(velocityTexture, coord + vec2(1.0, 0.0) * inverseCanvasSize).x;
    float lX = texture2D(velocityTexture, coord - vec2(1.0, 0.0) * inverseCanvasSize).x;
    float rY = texture2D(velocityTexture, coord + vec2(0.0, 1.0) * inverseCanvasSize).y;
    float lY = texture2D(velocityTexture, coord - vec2(0.0, 1.0) * inverseCanvasSize).y;
    
    if((coord + vec2(1.0, 0.0) * inverseCanvasSize).x > 1.0)
    {
      rX = -coord.x;
    }
    
    if((coord - vec2(1.0, 0.0) * inverseCanvasSize).x < 0.0)
    {
      lX = -coord.x;
    }
    
    if((coord + vec2(0.0, 1.0) * inverseCanvasSize).y > 1.0)
    {
      rY = -coord.y;
    }
    
    if((coord - vec2(0.0, 1.0) * inverseCanvasSize).y < 0.0)
    {
      lY = -coord.y;
    }
    
    float diverged = 0.5 / (inverseCanvasSize.x * inverseCanvasSize.y) * ((rX - lX) + (rY - lY));
    
    gl_FragColor = vec4(diverged, 0.0, 0.0, 0.0);
}