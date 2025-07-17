export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Node {
  id: string;
  title: string;
  position: Position;
  size: Size;
  type: NodeType;
  selected: boolean;
  color: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum NodeType {
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  DIAMOND = 'diamond',
  TEXT = 'text'
}

export interface NodeStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  borderRadius: number;
  opacity: number;
}

export class DiagramNode implements Node {
  id: string;
  title: string;
  position: Position;
  size: Size;
  type: NodeType;
  selected: boolean;
  color: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    title: string,
    position: Position,
    type: NodeType = NodeType.RECTANGLE,
    size: Size = { width: 120, height: 60 }
  ) {
    this.id = id;
    this.title = title;
    this.position = position;
    this.size = size;
    this.type = type;
    this.selected = false;
    this.color = '#3b82f6'; // Default blue
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  updatePosition(newPosition: Position): void {
    this.position = newPosition;
    this.updatedAt = new Date();
  }

  updateSize(newSize: Size): void {
    this.size = newSize;
    this.updatedAt = new Date();
  }

  updateTitle(newTitle: string): void {
    this.title = newTitle;
    this.updatedAt = new Date();
  }

  updateId(newId: string): void {
    this.id = newId;
    this.updatedAt = new Date();
  }

  select(): void {
    this.selected = true;
    this.updatedAt = new Date();
  }

  deselect(): void {
    this.selected = false;
    this.updatedAt = new Date();
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: this.size.height
    };
  }

  getCenter(): Position {
    return {
      x: this.position.x + this.size.width / 2,
      y: this.position.y + this.size.height / 2
    };
  }

  containsPoint(point: Position): boolean {
    const bounds = this.getBounds();
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }

  clone(): DiagramNode {
    const cloned = new DiagramNode(
      this.id + '_copy',
      this.title,
      { ...this.position },
      this.type,
      { ...this.size }
    );
    cloned.selected = this.selected;
    cloned.color = this.color;
    cloned.description = this.description;
    cloned.metadata = this.metadata ? { ...this.metadata } : undefined;
    return cloned;
  }
}