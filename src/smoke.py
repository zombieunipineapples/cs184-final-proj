import direct.directbase.DirectStart
from panda3d.core import loadPrcFileData, Texture, GraphicsOutput, MouseButton

loadPrcFileData('', 'show-buffers #t')
loadPrcFileData('', 'sync-video #t')


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


myShader = Shader.load(Shader.SL_GLSL,
                       vertex="default.vert",
                       fragment="smoke.frag")


card = CardMaker('test')
card.setFrameFullscreenQuad()


class RenderToTexture:
    def __init__(self):
        self.A = Texture()
        self.B = Texture()
        self.buffer = makeOffscreenBuffer()
        self.camera = base.makeCamera(self.buffer, lens=lens)
        self.mesh = NodePath(card.generate())
        self.camera.reparentTo(self.mesh)
        self.camera.setPos(0, -1, 0)
        self.mesh.setShader(myShader)
        self.mesh.setShaderInputs(
            res=(w, h),
            bufferTexture=self.A,
            smokeSource=(0.0, 0.0, 0.0),
        )


def makeOffscreenBuffer() -> GraphicsOutput:
    fb_prop = FrameBufferProperties()
    fb_prop.setRgbColor(True)
    fb_prop.setRgbaBits(8, 8, 8, 8)
    fb_prop.setDepthBits(16)

    # Create a WindowProperties object set to 512x512 size.
    win_prop = WindowProperties.size(w, h)

    # Don't open a window - force it to be an offscreen buffer.
    flags = GraphicsPipe.BF_refuse_window

    return base.graphicsEngine.make_output(base.pipe, "My Buffer", -100, fb_prop, win_prop, flags,
                                           base.win.getGsg(), base.win)


rt1 = RenderToTexture()
Mesh2 = render2d.attachNewNode(card.generate())


hw = w // 2
hh = h // 2


def render(task):
    if base.mouseWatcherNode.hasMouse():
        # (-1, -1) would be bottom left, (1, 1) for top-right
        # convert scale
        x = base.mouseWatcherNode.getMouseX()
        x = hw + (x * hw)
        y = base.mouseWatcherNode.getMouseY()
        y = hh + (y * hh)

        z = 0.1 if base.mouseWatcherNode.isButtonDown(MouseButton.one()) else 0.0
        rt1.mesh.setShaderInput('smokeSource', (x, y, z))

    rt1.buffer.clearRenderTextures()
    rt1.buffer.addRenderTexture(rt1.B, GraphicsOutput.RTMCopyTexture)
    rt1.mesh.setShaderInput('bufferTexture', rt1.B)
    Mesh2.setTexture(rt1.A)

    base.graphicsEngine.renderFrame()

    rt1.buffer.addRenderTexture(rt1.A, GraphicsOutput.RTMCopyTexture)
    rt1.mesh.setShaderInput('bufferTexture', rt1.A)
    Mesh2.setTexture(rt1.B)

    return task.cont


taskMgr.add(render)


base.run()