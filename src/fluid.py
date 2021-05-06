import direct.directbase.DirectStart
from panda3d.core import loadPrcFileData, Texture, GraphicsOutput, MouseButton


from panda3d.core import NodePath, FrameBufferProperties, WindowProperties, GraphicsPipe

from panda3d.core import Shader, CardMaker

w, h = 512, 512
props = WindowProperties()
props.setSize(w, h)
base.win.requestProperties(props)

from panda3d.core import OrthographicLens

lens = OrthographicLens()
lens.setFilmSize(1, 1)
lens.setNearFar(1, 1000)
base.cam.node().setLens(lens)

card = CardMaker('test')
card.setFrameFullscreenQuad()


import random


def makeOffscreenBuffer(name, sort) -> GraphicsOutput:
    fb_prop = FrameBufferProperties()
    fb_prop.setRgbColor(True)
    fb_prop.setRgbaBits(8, 8, 8, 8)
    fb_prop.setDepthBits(16)
    fb_prop.setFloatColor(True)

    # Create a WindowProperties object set to 512x512 size.
    win_prop = WindowProperties.size(w, h)

    # Don't open a window - force it to be an offscreen buffer.
    flags = GraphicsPipe.BF_refuse_window

    output = base.graphicsEngine.make_output(base.pipe, name, sort, fb_prop, win_prop, flags,
                                           base.win.getGsg(), base.win)
    
    # Should fix lag but doesn't work.
    # output.one_shot = True
    return output


class RenderBuffer:
    def __init__(self, name, sort):
        self.buffer = makeOffscreenBuffer(name, sort)
        self.camera = base.makeCamera(self.buffer, lens=lens)
        self.quad = NodePath(card.generate())
        self.camera.reparentTo(self.quad)
        self.camera.setPos(0, -1, 0)
        self.texture = Texture()
    
    def renderFrame(self, texture):
        self.buffer.addRenderTexture(texture, GraphicsOutput.RTMCopyTexture)
        self.buffer.active = True
        base.graphicsEngine.renderFrame()
        self.buffer.clearRenderTextures()

    def setShader(self, shader):
        self.quad.setShader(shader)

    def addRenderTexture(self, texture):
        self.buffer.addRenderTexture(texture, GraphicsOutput.RTMCopyTexture)

    def clearRenderTextures(self):
        self.buffer.clearRenderTextures()

    @property
    def active(self):
        return self.buffer.active

    @active.setter
    def active(self, active):
        self.buffer.active = active
        pass


# Initialize buffers.

densityBuffer = RenderBuffer('Density', -100)
densityBackBuffer = RenderBuffer('DensityBack', -99)
velocityBuffer = RenderBuffer('Velocity', -98)
velocityBackBuffer = RenderBuffer('VelocityBack', -97)
pressureBuffer = RenderBuffer('Pressure', -96)
pressureBackBuffer = RenderBuffer('PressureBack', -95)
divergenceBuffer = RenderBuffer('Divergence', -94)
divergenceBackBuffer = RenderBuffer('DivergenceBack', -93)


def loadShader(frag):
    return Shader.load(Shader.SL_GLSL, vertex='default.vert', fragment=frag)


AdvectShader = loadShader('advect.frag')
DivergenceShader = loadShader('divergence.frag')
JacobiShader = loadShader('jacobi.frag')
GradientShader = loadShader('gradient.frag')
SplatShader = loadShader('splat.frag')
BoundaryShader = loadShader('boundary.frag')
MainShader = loadShader('main.frag')

visualizeQuad = NodePath(card.generate())
visualizeQuad.reparentTo(render2d)


inverseCanvasSize = (1.0 / w, 1.0 / h)


def enableAll():
    densityBuffer.active = True
    densityBackBuffer.active = True
    velocityBuffer.active = True
    velocityBackBuffer.active = True
    pressureBuffer.active = True
    pressureBackBuffer.active = True
    divergenceBuffer.active = True
    divergenceBackBuffer.active = True


def advectVelocity(timestep):
    velocityBackBuffer.active = True

    velocityBackBuffer.addRenderTexture(velocityBackBuffer.texture)
    velocityBackBuffer.quad.setShader(AdvectShader)
    velocityBackBuffer.quad.setShaderInputs(isVelocity=True, toAdvectTexture=velocityBuffer.texture,
                                            velocityTexture=velocityBuffer.texture, dt=timestep, inverseCanvasSize=inverseCanvasSize)

    base.graphicsEngine.renderFrame()
    velocityBuffer.clearRenderTextures()
    # velocityBackBuffer.quad.setShaderInputs(isVelocity=False, toAdvectTexture=None, velocityTexture=None, dt=0.0)


def divergeVelocity():
    divergenceBuffer.active = True

    divergenceBuffer.addRenderTexture(divergenceBuffer.texture)
    divergenceBuffer.quad.setShader(DivergenceShader)
    divergenceBuffer.quad.setShaderInputs(velocityTexture=velocityBackBuffer.texture, inverseCanvasSize=inverseCanvasSize)
    base.graphicsEngine.renderFrame()
    divergenceBuffer.clearRenderTextures()
    # divergenceBuffer.quad.setShaderInputs(velocityTexture=None)


def jacobiPressure():
    NUM_JACOBI_ITERATIONS = 10

    pressureBuffer.active = True
    pressureBuffer.addRenderTexture(pressureBuffer.texture)
    pressureBuffer.quad.setColor(0, 0, 0)
    base.graphicsEngine.renderFrame()
    pressureBuffer.clearRenderTextures()

    pressureBuffer.active = True
    pressureBackBuffer.addRenderTexture(pressureBackBuffer.texture)
    pressureBackBuffer.quad.setColor(0, 0, 0)
    base.graphicsEngine.renderFrame()

    for i in range(NUM_JACOBI_ITERATIONS):
        pressureBackBuffer.active = True
        pressureBackBuffer.addRenderTexture(pressureBackBuffer.texture)
        pressureBackBuffer.quad.setShader(JacobiShader)
        pressureBackBuffer.quad.setShaderInputs(xTex=pressureBuffer.texture, bTex=divergenceBuffer.texture, 
                                                inverseCanvasSize=inverseCanvasSize, alpha=-1.0 / (w * h),
                                                inverseBeta=0.25)
        base.graphicsEngine.renderFrame()
        pressureBackBuffer.clearRenderTextures()

        swapBufferTextures(pressureBuffer, pressureBackBuffer)

    # pressureBackBuffer.quad.setShaderInputs(xTex=None, bTex=None)
    pressureBackBuffer.clearRenderTextures()


def swapBufferTextures(bufferA: RenderBuffer, bufferB: RenderBuffer):
    t = bufferA.texture
    bufferA.texture = bufferB.texture
    bufferB.texture = t

    bufferA.quad.setTexture(bufferB.texture)
    bufferB.quad.setTexture(bufferA.texture)


def subtractGradient():
    velocityBackBuffer.active = True
    velocityBackBuffer.addRenderTexture(velocityBackBuffer.texture)
    velocityBackBuffer.quad.setShader(GradientShader)
    velocityBackBuffer.quad.setShaderInputs(velocityTexture=velocityBuffer.texture, pressureTexture=pressureBuffer.texture)
    base.graphicsEngine.renderFrame()
    velocityBuffer.clearRenderTextures()


def advectDensity(timestep):
    densityBackBuffer.active = True
    densityBackBuffer.addRenderTexture(densityBackBuffer.texture)
    densityBackBuffer.quad.setShader(AdvectShader)
    densityBackBuffer.quad.setShaderInputs(isVelocity=False, toAdvectTexture=densityBuffer.texture,
                                           velocityTexture=velocityBuffer.texture, dt=timestep,
                                           inverseCanvasSize=inverseCanvasSize)
    base.graphicsEngine.renderFrame()
    densityBackBuffer.clearRenderTextures()
    # densityBackBuffer.quad.setShaderInputs(isVelocity=False, toAdvectTexture=None, velocityTexture=None, dt=0.0)


def addDensity(x, y):
    densityBackBuffer.active = True
    densityBackBuffer.addRenderTexture(densityBackBuffer.texture)
    densityBackBuffer.quad.setShader(SplatShader)
    densityBackBuffer.quad.setShaderInputs(
        bufferTexture=densityBuffer.texture,
        splatPos=(x, y),
        splatVal=(1.0, random.random(), random.random(), 0.0),
        isVelocity=False,
        inverseCanvasSize=inverseCanvasSize,
        splatRadius=25,
    )
    base.graphicsEngine.renderFrame()
    densityBackBuffer.clearRenderTextures()

    swapBufferTextures(densityBuffer, densityBackBuffer)


def addVelocity(x, y, diffX, diffY):
    velocityBackBuffer.active = True
    velocityBackBuffer.addRenderTexture(velocityBackBuffer.texture)
    velocityBackBuffer.quad.setShader(SplatShader)
    velocityBackBuffer.quad.setShaderInputs(
        bufferTexture=velocityBuffer.texture,
        splatPos=(x, y),
        splatVal=(diffX * 100000, diffY * 100000, 0.0, 0.0),
        isVelocity=True,
        inverseCanvasSize=inverseCanvasSize,
        splatRadius=50,
    )
    base.graphicsEngine.renderFrame()
    velocityBackBuffer.clearRenderTextures()
    swapBufferTextures(velocityBuffer, velocityBackBuffer)



hw = w // 2
hh = h // 2


prevMouseX = 0.0
prevMouseY = 0.0

time = 0.0


def update(task):
    global time

    advectVelocity(time)
    divergeVelocity()
    jacobiPressure()

    swapBufferTextures(velocityBuffer, velocityBackBuffer)

    subtractGradient()
    advectDensity(time)

    swapBufferTextures(velocityBuffer, velocityBackBuffer)
    swapBufferTextures(pressureBuffer, pressureBackBuffer)
    swapBufferTextures(densityBuffer, densityBackBuffer)

    visualizeQuad.setShader(MainShader)
    visualizeQuad.setTransparency(True)
    visualizeQuad.setShaderInputs(inputTexture=densityBuffer.texture, inverseCanvasSize=inverseCanvasSize)

    densityBuffer.active = True
    densityBackBuffer.active = True
    velocityBuffer.active = True
    velocityBackBuffer.active = True
    pressureBuffer.active = True
    pressureBackBuffer.active = True
    divergenceBuffer.active = True
    divergenceBackBuffer.active = True

    base.graphicsEngine.renderFrame()

    time += 0.0001

    return task.cont


def updateMousePosition(task):
    global prevMouseX, prevMouseY

    if base.mouseWatcherNode.hasMouse():
        # (-1, -1) would be bottom left, (1, 1) for top-right
        x = base.mouseWatcherNode.getMouseX()
        x = hw + (x * hw)
        y = base.mouseWatcherNode.getMouseY()
        y = hh - (y * hh)

        if x and y:
            mouseX = x / w
            mouseY = (h - y) / h

            if base.mouseWatcherNode.isButtonDown(MouseButton.one()):
                addDensity(mouseX, mouseY)
                addVelocity(mouseX, mouseY, mouseX - prevMouseX, mouseY - prevMouseY)
                prevMouseX = mouseX
                prevMouseY = mouseY
    
    return task.cont


base.setBackgroundColor(0, 0, 0)


base.setFrameRateMeter(1)


taskMgr.add(updateMousePosition, sort=-60)
taskMgr.add(update, sort=-50)

base.run()
