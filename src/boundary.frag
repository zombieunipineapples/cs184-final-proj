precision highp float;
uniform sampler2D inputTexture;
uniform float inverseCanvasSize;

void main()
{
    vec2 coord = gl_FragCoord.xy * inverseCanvasSize;
    
    gl_FragColor = texture2D(inputTexture, coord);
    
    if(coord.x <= 0.01 || coord.x >= 0.99)
    {
    gl_FragColor.x *= -1.0;
    }
    
    if(coord.y <= 0.01 || coord.y >= 0.99)
    {
    gl_FragColor.y *= -1.0;
    }
}