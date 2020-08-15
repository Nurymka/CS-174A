window.Assignment_Two_Test = window.classes.Assignment_Two_Test =
class Assignment_Two_Test extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   ) 
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 

        context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );
        this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );

        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );

        const shapes = { 
                        //  torus2: new ( Torus.prototype.make_flat_shaded_version() )( 15, 15 ),
                                // TODO:  Fill in as many additional shape instances as needed in this key/value table.
                                //        (Requirement 1)
                        sun: new Subdivision_Sphere(4),
                        planet1: new (Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
                        planet2: new Subdivision_Sphere(3),
                        planet3_torus: new Torus(15, 15),
                        planet3: new Subdivision_Sphere(4),
                        planet4: new Subdivision_Sphere(4),
                        planet4_moon: new (Subdivision_Sphere.prototype.make_flat_shaded_version())(1)
                       }
        this.submit_shapes( context, shapes );
                                     
                                     // Make some Material objects available to you:
        this.materials =
          { test:     context.get_instance( Phong_Shader ).material( Color.of( 1,1,0,1 ), { ambient:.2 } ),
            ring:     context.get_instance( Ring_Shader  ).material(),
            sun: context.get_instance(Phong_Shader).material(Color.of(0,0,0,1), { ambient: 1 }),
            planet1: context.get_instance(Phong_Shader).material(
              Colors.icy_grey(), {
                ambient: 0, diffusivity: 1, specularity: 0
              }),
            planet2: context.get_instance(Phong_Shader).material(
              Colors.swampy_green(), {
                diffusivity: 0.45, specularity: 1
              }),
            planet3: context.get_instance(Phong_Shader).material(
              Colors.muddy_brown(), {
                diffusivity: 1, specularity: 1
              }),
            planet4: context.get_instance(Phong_Shader).material(
              Colors.light_blue(), {
                specularity: 0.8, smoothness: 60
              }),
            planet4_moon: context.get_instance(Phong_Shader).material(Colors.swampy_green())
                                // TODO:  Fill in as many additional material objects as needed in this key/value table.
                                //        (Requirement 1)
          }

        this.lights = [
          new Light( Vec.of( 0,0,0,1 ), Color.of( 0, 1, 1, 1 ), 1000 ),
        ];
      }
    make_control_panel()            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
      { this.key_triggered_button( "View solar system",  [ "0" ], () => this.attached = () => this.initial_camera_location );
        this.new_line();
        this.key_triggered_button( "Attach to planet 1", [ "1" ], () => this.attached = () => this.planet_1 );
        this.key_triggered_button( "Attach to planet 2", [ "2" ], () => this.attached = () => this.planet_2 ); this.new_line();
        this.key_triggered_button( "Attach to planet 3", [ "3" ], () => this.attached = () => this.planet_3 );
        this.key_triggered_button( "Attach to planet 4", [ "4" ], () => this.attached = () => this.planet_4 ); this.new_line();
        this.key_triggered_button( "Attach to planet 5", [ "5" ], () => this.attached = () => this.planet_5 );
        this.key_triggered_button( "Attach to moon",     [ "m" ], () => this.attached = () => this.moon     );
      }
    // Point 1
    current_sun_radius(t) {
      return 2 + Math.sin(2/5*Math.PI*t);
    }
    current_sun_color(t) {
      const color_t = 0.5 + 0.5*Math.sin(2/5*Math.PI*t);
      return Color.of(color_t, 0, 1 - color_t, 1);
    }
    draw_sun(graphics_state, t, dt) {
      const scale_factor = this.current_sun_radius(t);
      const scale_matrix = Mat4.identity().times(Mat4.scale([scale_factor, scale_factor, scale_factor]));
      const color_material = this.materials.sun.override({ 
        color: this.current_sun_color(t)
      });
      this.shapes.sun.draw(graphics_state, scale_matrix, color_material);
    }
    // Point 2
    place_light_source(t, dt) {
      const light_size = 10 ** this.current_sun_radius(t);
      const light_color = this.current_sun_color(t);
      this.lights = [
        new Light( Vec.of(0, 0, 0, 1), light_color, light_size)
      ];
    }
    // Planet 1
    draw_planet1(graphics_state, t, dt) {
      const translation_matrix = Mat4.identity()
        .times(Mat4.translation(Vec.of(5 * Math.cos(t), 0, 5 * Math.sin(t))));
      const matrix = translation_matrix
        .times(Mat4.rotation(t, Vec.of(0, 1, 0)));
      this.planet_1 = translation_matrix;
      this.shapes.planet1.draw(graphics_state, matrix, this.materials.planet1);
    }
    draw_planet2(graphics_state, t) {
      const translation_matrix = Mat4.identity()
        .times(Mat4.translation(Vec.of(8 * Math.cos(0.8*t - Math.PI * 0.3), 0, 8 * Math.sin(0.8*t - Math.PI * 0.3))))
      const matrix = translation_matrix
        .times(Mat4.rotation(t, Vec.of(0, 1, 0)));
      const material = this.materials.planet2.override({
        gouraud: Math.floor(t) % 2 == 1
      });
      this.planet_2 = translation_matrix;
      this.shapes.planet2.draw(graphics_state, matrix, material);
    }
    draw_planet3(graphics_state, t) {
      const translation_matrix = Mat4.identity()
        .times(Mat4.translation(Vec.of(11 * Math.cos(0.6*t - Math.PI * 0.6), 0, 11 * Math.sin(0.6*t - Math.PI * 0.6))));
      const planet_matrix = translation_matrix
        .times(Mat4.rotation(t, Vec.of(1, 1, 0)));
      const torus_matrix = planet_matrix
        .times(Mat4.scale(Vec.of(1, 1, 0.3)));
  
      this.planet_3 = translation_matrix;

      this.shapes.planet3.draw(graphics_state, planet_matrix, this.materials.planet3);
      this.shapes.planet3_torus.draw(graphics_state, torus_matrix, this.materials.ring);
    }
    draw_planet4(graphics_state, t) {
      const planet_translation = Mat4.identity()
        .times(Mat4.translation(Vec.of(14 * Math.cos(0.4*t - Math.PI * 0.8), 0, 14 * Math.sin(0.4*t - Math.PI * 0.8))))
      const planet_matrix = planet_translation
        .times(Mat4.rotation(t, Vec.of(0, 1, 0)));
      const moon_matrix = planet_translation
        .times(Mat4.translation(Vec.of(3 * Math.cos(t), 0, 3 * Math.sin(t))))
        .times(Mat4.rotation(t, Vec.of(0, 1, 0)));
      this.planet_4 = planet_translation;
      this.moon = moon_matrix;
      this.shapes.planet4.draw(graphics_state, planet_matrix, this.materials.planet4);
      this.shapes.planet4_moon.draw(graphics_state, moon_matrix, this.materials.planet4_moon);
    }
    display( graphics_state )
      { graphics_state.lights = this.lights;        // Use the lights stored in this.lights
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

        // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 2 and 3)
        this.draw_sun(graphics_state, t, dt);
        this.place_light_source(t, dt);
        this.draw_planet1(graphics_state, t, dt);
        this.draw_planet2(graphics_state, t);
        this.draw_planet3(graphics_state, t);
        this.draw_planet4(graphics_state, t);

        // configure camera
        if  (this.attached != null) {
          const target_planet_matrix = this.attached();
          const camera_matrix = Mat4.inverse(target_planet_matrix
            .times(Mat4.translation(Vec.of(0, 0, 5))));
          graphics_state.camera_transform = camera_matrix.map(
            (x, i) => Vec.from(graphics_state.camera_transform[i])
              .mix(x, 0.1)
          );
        }
      }
  }


// Extra credit begins here (See TODO comments below):

window.Ring_Shader = window.classes.Ring_Shader =
class Ring_Shader extends Shader              // Subclasses of Shader each store and manage a complete GPU program.
{ material() { return { shader: this } }      // Materials here are minimal, without any settings.
  map_attribute_name_to_buffer_name( name )       // The shader will pull single entries out of the vertex arrays, by their data fields'
    {                                             // names.  Map those names onto the arrays we'll pull them from.  This determines
                                                  // which kinds of Shapes this Shader is compatible with.  Thanks to this function, 
                                                  // Vertex buffers in the GPU can get their pointers matched up with pointers to 
                                                  // attribute names in the GPU.  Shapes and Shaders can still be compatible even
                                                  // if some vertex data feilds are unused. 
      return { object_space_pos: "positions" }[ name ];      // Use a simple lookup table.
    }
    // Define how to synchronize our JavaScript's variables to the GPU's:
  update_GPU( g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl )
      { const proj_camera = g_state.projection_transform.times( g_state.camera_transform );
                                                                                        // Send our matrices to the shader programs:
        gl.uniformMatrix4fv( gpu.model_transform_loc,             false, Mat.flatten_2D_to_1D( model_transform.transposed() ) );
        gl.uniformMatrix4fv( gpu.projection_camera_transform_loc, false, Mat.flatten_2D_to_1D(     proj_camera.transposed() ) );
      }
  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
              varying vec4 position;
              varying vec4 center;
              varying vec4 color;
      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return `
        attribute vec3 object_space_pos;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_transform;

        void main()
        {
        }`;           // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    { return `
        void main()
        {
            gl_FragColor = color;
        }`;           // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
    }
}

window.Grid_Sphere = window.classes.Grid_Sphere =
class Grid_Sphere extends Shape           // With lattitude / longitude divisions; this means singularities are at 
  { constructor( rows, columns, texture_range )             // the mesh's top and bottom.  Subdivision_Sphere is a better alternative.
      { super( "positions", "normals", "texture_coords" );
        

                      // TODO:  Complete the specification of a sphere with lattitude and longitude lines
                      //        (Extra Credit Part III)
      } }

// Helper functions
class Colors {
  static icy_grey() {
    return Color.of(0.549,0.573,0.675,1);
  }
  static swampy_green() {
    return Color.of(0.639, 0.831, 0.149, 1);
  }
  static muddy_brown() {
    return Color.of(0.73, 0.408, 0.145, 1);
  }
  static light_blue() {
    return Color.of(0.678, 0.847, 0.902, 1);
  }
}