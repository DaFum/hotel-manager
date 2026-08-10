with open("src/ui/HotelView.tsx", "r") as f:
    content = f.read()

pointer_search = """        onPointerMove={(event) => {
          const from = drag.current;
          const camera = cameraRef.current;
          if (!from || !camera) return;
          const dx = event.clientX - from.x;
          const dy = event.clientY - from.y;
          // Apply a small drag threshold to differentiate between a click and a pan.
          // This avoids panning from tiny unintentional movements during a click.
          // However, Pixi captures its own events for clicking rooms.
          drag.current = { x: event.clientX, y: event.clientY };
          moveCamera.current(dragCamera(camera, { x: dx, y: dy }));
        }}"""
pointer_replace = """        onPointerMove={(event) => {
          const from = drag.current;
          const camera = cameraRef.current;
          if (!from || !camera) return;
          const dx = event.clientX - from.x;
          const dy = event.clientY - from.y;
          // Apply a small drag threshold to differentiate between a click and a pan.
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            drag.current = { x: event.clientX, y: event.clientY };
            moveCamera.current(dragCamera(camera, { x: dx, y: dy }));
          }
        }}"""

content = content.replace(pointer_search, pointer_replace)

with open("src/ui/HotelView.tsx", "w") as f:
    f.write(content)
