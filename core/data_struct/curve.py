from PyQt5.QtGui import QPainterPath
from core.data_struct.arrow import Arrow
from core.data_struct.number_vector import NumberVector


class ConnectCurve:
    def __init__(self, start: NumberVector, end: NumberVector):
        self.start = start
        self.end = end
        self.path = QPainterPath(start.to_qt())
        diff = end - start
        if abs(diff.x) >= abs(diff.y):
            half_x = (end.x - start.x) / 2
            ctrl1 = NumberVector(start.x + half_x, start.y)
            ctrl2 = NumberVector(end.x - half_x, end.y)
        else:
            half_y = (end.y - start.y) / 2
            ctrl1 = NumberVector(start.x, start.y + half_y)
            ctrl2 = NumberVector(end.x, end.y - half_y)
        self.path.cubicTo(ctrl1.to_qt(), ctrl2.to_qt(), end.to_qt())
        self.arrow = Arrow(end - ctrl2, end)
        