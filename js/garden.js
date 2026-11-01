// Keep rendering helpers private while supporting direct file:// previews.
const Garden = (() => {
  const random = (min, max) => Math.random() * (max - min) + min;
  const randomInt = (min, max) => Math.floor(random(min, max + 1));
  const toRadians = (degrees) => ((2 * Math.PI) / 360) * degrees;

  function randomColor({ rmin, rmax, gmin, gmax, bmin, bmax, opacity }) {
    const red = Math.round(random(rmin, rmax));
    const green = Math.round(random(gmin, gmax));
    const blue = Math.round(random(bmin, bmax));
    return `rgba(${red},${green},${blue},${opacity})`;
  }

  function rotate({ x, y }, angle) {
    return {
      x: Math.cos(angle) * x - Math.sin(angle) * y,
      y: Math.sin(angle) * x + Math.cos(angle) * y
    };
  }

  class Petal {
    radius = 1;
    finished = false;

    constructor(stretchA, stretchB, startAngle, angle, growth) {
      this.stretchA = stretchA;
      this.stretchB = stretchB;
      this.startAngle = startAngle;
      this.angle = angle;
      this.growth = growth;
    }

    render(context, bloomRadius, color) {
      if (this.radius > bloomRadius) {
        this.finished = true;
        return;
      }

      this.radius += this.growth;
      const start = rotate(
        { x: 0, y: this.radius },
        toRadians(this.startAngle)
      );
      const end = rotate(start, toRadians(this.angle));

      context.strokeStyle = color;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.bezierCurveTo(
        start.x * this.stretchA,
        start.y * this.stretchA,
        end.x * this.stretchB,
        end.y * this.stretchB,
        end.x,
        end.y
      );
      context.stroke();
    }
  }

  class Bloom {
    constructor(x, y, radius, color, petalCount, { petalStretch, growFactor }) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      const angle = 360 / petalCount;
      const startAngle = randomInt(0, 90);
      this.petals = Array.from(
        { length: petalCount },
        (_, index) =>
          new Petal(
            random(petalStretch.min, petalStretch.max),
            random(petalStretch.min, petalStretch.max),
            startAngle + index * angle,
            angle,
            random(growFactor.min, growFactor.max)
          )
      );
    }

    render(context) {
      context.save();
      context.translate(this.x, this.y);
      for (const petal of this.petals) {
        petal.render(context, this.radius, this.color);
      }
      context.restore();
      return this.petals.every((petal) => petal.finished);
    }
  }

  return class Garden {
    static frameInterval = 1000 / 60;
    static options = {
      petalCount: { min: 8, max: 15 },
      petalStretch: { min: 0.1, max: 3 },
      growFactor: { min: 0.1, max: 1 },
      bloomRadius: { min: 8, max: 10 },
      color: {
        rmin: 128,
        rmax: 255,
        gmin: 0,
        gmax: 128,
        bmin: 0,
        bmax: 128,
        opacity: 0.1
      }
    };

    #blooms = [];

    constructor(context) {
      this.context = context;
    }

    get isIdle() {
      return this.#blooms.length === 0;
    }

    render() {
      // Preserve the original draw sequence for overlapping additive strokes.
      for (let index = 0; index < this.#blooms.length; index++) {
        if (this.#blooms[index].render(this.context)) {
          this.#blooms.splice(index, 1);
        }
      }
    }

    createRandomBloom(x, y) {
      const { bloomRadius, color, petalCount } = Garden.options;
      this.#blooms.push(
        new Bloom(
          x,
          y,
          randomInt(bloomRadius.min, bloomRadius.max),
          randomColor(color),
          randomInt(petalCount.min, petalCount.max),
          Garden.options
        )
      );
    }
  };
})();
