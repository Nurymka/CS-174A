PADDLE_LEFT = -20;
PADDLE_RIGHT = 20;
PADDLE_UP = -6.5;
PADDLE_DOWN = 6.5;
PADDLE_XSCALE = 0.7;
PADDLE_YSCALE = 1.0;
PADDLE_ZSCALE = 2.5;
SKYBOX_SIZE = 40;
window.Assignment_Two_Test = window.classes.Assignment_Two_Test =
class ThreeD_Pong extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   )
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) );

        context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,45,45 ), Vec.of( 0,10,0 ), Vec.of( 0,1,0 ) );
        this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );

        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );
        const shapes = {
                         puck: new Subdivision_Sphere(5),
                         reflect_puck: new Subdivision_Circle(5),
                         shadow_puck: new Subdivision_Circle(5),
                         floor: new Cube(),
                         stick_left: new Cube(),
                         stick_right: new Cube(),
                         skybox_plane: new Square(),
                         number: new Square(),
                       }
        this.submit_shapes( context, shapes );

        this.materials =
          { test:         context.get_instance( Phong_Shader ).material( Color.of( 1,1,0,1 ), { ambient:.2 } ),
            ball:         context.get_instance( Phong_Shader ).material(Color.of(0.196,0.878,0.973,1)),
            floor:        context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), { ambient: 1, diffuse: 1,
              texture: context.get_instance("assets/pong-board.jpg", true)}),
            stick_left:   context.get_instance( Phong_Shader ).material(Color.of(0.027,0.6,0.831,1), { ambient: 0.8, } ),
            stick_right:  context.get_instance( Phong_Shader ).material(Color.of(0.847,0.376,0.812,1),  { ambient: 1 } ),
            puck:         context.get_instance( Phong_Shader ).material(Color.of(0.945,0.808,0.435, 1),  { ambient: 0.7 } ),
            puck_scored:  context.get_instance( Phong_Shader ).material(Color.of(0,0,1,1),  { ambient: 1, specularity: 0.7 } ),
            shadow_puck: context.get_instance( Phong_Shader ).material(Color.of(0,0,0,1),  { ambient: 1 } ),
            reflect_puck: context.get_instance(ReflectPuck_Shader).material(Color.of(0.945,0.808,0.435, 1), { ambient: 1 } ),
            skybox_negx: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
              ambient: 1,
              texture: context.get_instance("assets/retro-left.jpg", true)
            }),
            skybox_posx: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
              ambient: 1,
              texture: context.get_instance("assets/retro-right.jpg", true)
            }),
            skybox_negz: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1), {
              ambient: 1,
              texture: context.get_instance("assets/retro-front.jpg", true)
            }),
            ...generateNumberShapes(context),
          }

        this.lights = [ new Light( Vec.of(0, 5, 0, 1 ), Color.of( 1, 1, 1, 1 ), 1000000 )];
        this.model = Mat4.identity();

        // Store models for paddles and puck
        this.paddle_dim = [PADDLE_XSCALE, PADDLE_YSCALE, PADDLE_ZSCALE]; // Paddle dimensions
        this.pos_left = 0.0; this.pos_right = 0.0;
        this.LEFT_UP = false; this.LEFT_DOWN = false;
        this.RIGHT_UP = false; this.RIGHT_DOWN = false;
        // Puck variables
        this.z_SIGN = Math.random() < 0.5 ? -1 : 1;
        this.x_SIGN = Math.random() < 0.5 ? -1 : 1;
        this.puck_x = 0;
        this.puck_z = 0;
        this.collision = false;
        this.COL_LEFT = false;
        this.COL_RIGHT = false;
        this.SCORE_RIGHT = false;
        this.SCORE_LEFT = false;
        this.amb_val = 0.0;
        this.prev_dist = 0.0;
        this.shadow_fact_x = 0.0;
        this.shadow_fact_z = 0.0;
        this.MAX_SCORE = 7;
        this.SPEEDX = 0.3;
        this.SPEEDZ = 0.2; 

        this.paddled = 0;
        this.left_score = 0;
        this.right_score = 0;
        this.paused = false;
        this.game_stop = true;
        this.scored_html = document.getElementById("scored"); 
        this.maxscore_html = document.getElementById("maxscore"); 
        this.speed_html = document.getElementById("realspeed"); 
        this.scored = 0;
        this.RESET_GAME = false;
       
        // Save the context
        this.con = context;
        this.model_puck = this.model.times(Mat4.translation([0, 2, 0]));
        this.reflect_puck = (Mat4.translation([PADDLE_LEFT+0.75, 2, 0.00])).times(Mat4.rotation( Math.PI/2, Vec.of( 0, 1, 0)));
        this.model_stick_left = this.model.times(Mat4.translation([-20, 2, 0]).times(Mat4.scale(this.paddle_dim))); // bounds:(near:10, far:-17)
        this.model_stick_right = this.model.times(Mat4.translation([20, 2, 0]).times(Mat4.scale(this.paddle_dim)));
        
        this.reset_reflect = (Mat4.translation([PADDLE_LEFT+0.75, 2, 0.00])).times(Mat4.rotation( Math.PI/2, Vec.of( 0, 1, 0)));
        this.reset_puck = this.model.times(Mat4.translation([0, 2, 0]));
        this.reset_left = this.model.times(Mat4.translation([-20, 2, 0]).times(Mat4.scale(this.paddle_dim))); // bounds:(near:10, far:-17)
        this.reset_right = this.model.times(Mat4.translation([20, 2, 0]).times(Mat4.scale(this.paddle_dim)));
      }
    make_control_panel()            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
      {
        this.key_triggered_button( "Player 1 Up", [ "t" ], () => { this.LEFT_UP = true;}, undefined, () => {this.LEFT_UP = false;});
        this.key_triggered_button( "Player 1 Down", [ "g" ], () => { this.LEFT_DOWN = true;}, undefined, () => {this.LEFT_DOWN = false;});
        this.key_triggered_button( "Player 2 Up", [ "k" ], () => { this.RIGHT_UP = true;}, undefined, () => {this.RIGHT_UP = false;});
        this.key_triggered_button( "Player 2 Down", [ "m" ], () => { this.RIGHT_DOWN = true;}, undefined, () => {this.RIGHT_DOWN = false});
        this.key_triggered_button( "New Game", [ "1" ], () => { document.location.reload() });
        this.key_triggered_button( "- Max Score", [ "2" ], () => {  this.MAX_SCORE -= 1; });   
        this.key_triggered_button( "+ Max Score", [ "3" ], () => {  this.MAX_SCORE += 1; }); 
        this.key_triggered_button( "- Speed", [ "4" ], () => { this.SPEEDX -= 0.05; this.SPEEDZ -= 0.025});   
        this.key_triggered_button( "+ Speed", [ "5" ], () => { this.SPEEDX += 0.05; this.SPEEDZ += 0.025}); 
        this.key_triggered_button( "Pause", [ "p" ], () => { this.paused = !this.paused;});  
      }

    reflect_move(graphics_state, reflect_puck)
    {
      // Start reflecting if the puck comes within 5 units of the left paddle
      if (Math.abs(PADDLE_LEFT + 1 - this.puck_x) <= 15) {

        // The puck is approaching the paddle pre collision increase luminosity
            let curr_dist = Math.abs(PADDLE_LEFT - this.puck_x);

            let z_dist = this.pos_left * PADDLE_ZSCALE - this.puck_z;

            if(!this.paused) {
              //gets closer to the paddle
              if(curr_dist < this.prev_dist) this.amb_val = this.amb_val + 0.035;
              //gets further from the paddle
              if(curr_dist > this.prev_dist) this.amb_val = this.amb_val - 0.035;
            }

            this.prev_dist = curr_dist; //Update Previous Distance
            
            let scale_factor = 0.1 + this.amb_val/3.0;
            this.reflect_puck = this.reflect_puck.times(Mat4.translation([z_dist, 0, 0]))
               .times(Mat4.scale([scale_factor, scale_factor, scale_factor]));         
              
            if (this.puck_x > PADDLE_LEFT) {
              if(this.COL_LEFT)
                this.shapes.reflect_puck.draw(graphics_state, this.reflect_puck, this.materials.reflect_puck.override({color: (Color.of(0.027,0.6,0.831,1))  })); 
              else if (this.COL_RIGHT)
                this.shapes.reflect_puck.draw(graphics_state, this.reflect_puck, this.materials.reflect_puck.override({color: (Color.of(0.847,0.376,0.812,1))  })); 
              else 
                this.shapes.reflect_puck.draw(graphics_state, this.reflect_puck, this.materials.reflect_puck.override({color: Color.of(0.945,0.808,0.475, this.amb_val / 2.0)  })); 
            }
      }
      return reflect_puck;
    }

    ball_move(graphics_state, puck, reflect_puck)
    {
      let x = this.x_SIGN * this.SPEEDX; // 0.5 TODO: change back to 0.5
      let z = this.z_SIGN * this.SPEEDZ;
      // x=0;z=0
      let scale_pos_left = this.pos_left * PADDLE_ZSCALE;
      let scale_pos_right = this.pos_right * PADDLE_ZSCALE;
      var EDGE_BOUND = 6.5/PADDLE_ZSCALE;

      // For Top and Bottom Collision
      if ( (this.puck_z <= -18 && this.z_SIGN < 0) || (this.puck_z >= 18 && this.z_SIGN > 0) ) {
        z *= -1; this.z_SIGN *= -1;
      }

      // Ball hits left side of arena
      if (Math.abs(PADDLE_LEFT + 1 - this.puck_x) <= 0.3) { // Left Paddle Position
        // Collision with the left paddle
        if (this.x_SIGN < 0 && Math.abs(scale_pos_left - this.puck_z) < EDGE_BOUND ){
          x *= -1;
          z *= -1;
          this.x_SIGN *= -1;
          this.COL_LEFT = true; this.COL_RIGHT = false;
          this.paddled += 1;
        }
        else { // goal scored by the right player
          x *= -1;
          z *= -1;
          this.x_SIGN *= -1;

          this.right_score += 1; this.scored += 1;
          this.SCORE_RIGHT = true;
        }
      }

      // Ball hits right side of arena
      if (Math.abs(PADDLE_RIGHT - 1 - this.puck_x) <= 0.3) { // Right Paddle Position
        // Collision with the right paddle
        if (this.x_SIGN > 0 && Math.abs(scale_pos_right - this.puck_z) < EDGE_BOUND ){
          x *= -1;
          z *= -1;
          this.x_SIGN *= -1;
          this.COL_RIGHT = true; this.COL_LEFT = false;
          this.paddled += 1;

        }
        else { // goal scored by the left player
          x *= -1;
          z *= -1;
          this.x_SIGN *= -1;

          this.left_score += 1; this.scored += 1;
          this.SCORE_LEFT = true;
        }
      }
      this.shadow_fact_x = this.puck_x
      this.shadow_fact_z = this.puck_z
      this.puck_x += x; this.puck_z += z;
      puck = puck.times(Mat4.translation([x, 0, z]));
      return puck;
    }


    start_round(graphics_state) 
    {
        this.pos_left = 0.0; this.pos_right = 0.0;
        this.LEFT_UP = false; this.LEFT_DOWN = false;
        this.RIGHT_UP = false; this.RIGHT_DOWN = false;
        // Puck variables
        this.z_SIGN = Math.random() < 0.5 ? -1 : 1;
        this.x_SIGN = Math.random() < 0.5 ? -1 : 1;
        this.puck_x = 0;
        this.puck_z = 0;
        this.collision = false;
        this.COL_LEFT = false;
        this.COL_RIGHT = false;
        this.SCORE_RIGHT = false;
        this.SCORE_LEFT = false;
        this.amb_val = 0.0;
        this.prev_dist = 0.0;
        this.shadow_fact_x = 0.0;
        this.shadow_fact_z = 0.0;

        this.paddled = 0;
        this.paused = false;
        this.game_stop = true;
        this.scored_html = document.getElementById("scored"); 
    }

    display( graphics_state )
      { graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
        graphics_state.paddle_zscale = PADDLE_ZSCALE;
        graphics_state.z_dist = this.pos_left * PADDLE_ZSCALE - this.puck_z;
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
        let model = Mat4.identity();
        let model_left = (Mat4.translation([PADDLE_LEFT, 0, 0]));
        let model_right = (Mat4.translation([PADDLE_RIGHT, 0, 0]));
        var new_left = 0.0; var new_right = 0.0;
        this.maxscore_html.innerText = this.MAX_SCORE;
        this.speed_html.innerText = Math.round(this.SPEEDX*20);

        // TODO: Collisions, Reflection, Transparency, Shadows
        // 0) Initializing GLSL Contexts
        let gl = this.con.gl;
        this.con.gl.disable(gl.BLEND);
        this.con.gl.depthMask(true);
        this.con.gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Draw Skybox
        const model_skybox = model.times(Mat4.scale([SKYBOX_SIZE, SKYBOX_SIZE, SKYBOX_SIZE]));
        const model_skybox_negx = model_skybox
          .times(Mat4.translation([-1, 0, 0]))
          .times(Mat4.rotation(Math.PI / 2, Vec.of(0, 1, 0)));
        this.shapes.skybox_plane.draw(graphics_state, model_skybox_negx,
          this.materials.skybox_negx);

        const model_skybox_posx = model_skybox
          .times(Mat4.translation([1, 0, 0]))
          .times(Mat4.rotation(-Math.PI / 2, Vec.of(0, 1, 0)));
        this.shapes.skybox_plane.draw(graphics_state, model_skybox_posx,
          this.materials.skybox_posx);

        const model_skybox_negz = model_skybox
          .times(Mat4.translation([0, 0, -1]));
        this.shapes.skybox_plane.draw(graphics_state, model_skybox_negz,
          this.materials.skybox_negz);

        // 0) Resetting Game
        if(this.RESET_GAME)
          document.location.reload();

        // 1) Draw Floor
        let model_floor = Mat4.identity()
          .times(Mat4.rotation(Math.PI, Vec.of(0, 1, 0)))
          .times(Mat4.scale([22.5, 1, 20]));
        this.shapes.floor.draw(graphics_state, model_floor, this.materials.floor);

        // 2)Draw Scores
        let model_score = Mat4.identity().times(Mat4.translation([0, 0, 0]))
          .times(Mat4.rotation(-Math.PI / 2, Vec.of(1, 0, 0))).times(Mat4.scale([4, 4, 4]));
        let model_left_score = model_score.times(Mat4.translation([-2.5, 0, 0.3]));
        let model_right_score = model_score.times(Mat4.translation([2.5, 0, 0.3]));

        drawScore(graphics_state, model_left_score, this.shapes.number, this.materials, this.left_score, this.MAX_SCORE);
        drawScore(graphics_state, model_right_score, this.shapes.number, this.materials, this.right_score, this.MAX_SCORE);

        // 3) Draw Left Paddle
        if (this.LEFT_UP && !this.LEFT_DOWN && this.pos_left > PADDLE_UP)
          { new_left = -0.2; this.pos_left -= 0.2; }
        if (this.LEFT_DOWN && !this.LEFT_UP && this.pos_left < PADDLE_DOWN)
          { new_left = 0.2; this.pos_left += 0.2; }

        this.model_stick_left = this.model_stick_left.times(Mat4.translation([0,0, new_left]));
        this.shapes.stick_left.draw(graphics_state, this.model_stick_left, this.materials.stick_left);

        // 3) Draw reflection
        this.reflect_puck = this.reflect_puck.times(Mat4.translation([-new_left*PADDLE_ZSCALE,0, 0]));
        this.reflect_puck = this.reflect_move(graphics_state, this.reflect_puck);

        // 4) Draw Puck
        if (!this.paused) this.model_puck = this.ball_move(graphics_state, this.model_puck);

        if(this.COL_LEFT) 
          this.shapes.puck.draw(graphics_state, this.model_puck, this.materials.stick_left);
        else if (this.COL_RIGHT)
          this.shapes.puck.draw(graphics_state, this.model_puck, this.materials.stick_right);
        else 
          this.shapes.puck.draw(graphics_state, this.model_puck, this.materials.puck);
       
        //draw shadow
        let shadow_model = this.model_puck
        let s_x = 0.0
        if(this.puck_x<0) s_x = -1
        
        else s_x = 1
        if(this.puck_z < 0)
        {
          shadow_model = shadow_model.times(Mat4.translation([s_x,-0.5,-0.5]))
          shadow_model = shadow_model.times(Mat4.rotation(Math.PI/2,Vec.of( 1,0,0 )))
        }
        else {
          shadow_model = shadow_model.times(Mat4.translation([s_x,-0.5,0.5]))
          shadow_model = shadow_model.times(Mat4.rotation(Math.PI/2,Vec.of( -1,0,0 )))
        }
  
        let abs_x = Math.abs(this.puck_x)/15
        let abs_z = Math.abs(this.puck_z)/15
        shadow_model = shadow_model.times(Mat4.scale([abs_x,1,abs_z]))
        this.shapes.shadow_puck.draw(graphics_state,shadow_model,this.materials.shadow_puck);

        // 5) Enable Transperancy
        this.con.gl.enable(gl.BLEND);
        this.con.gl.depthMask(false);
        this.con.gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // 6) Draw Right Paddle
        if (this.RIGHT_UP && !this.RIGHT_DOWN && this.pos_right > PADDLE_UP)
          { new_right = -0.2; this.pos_right -= 0.2; }
        if (this.RIGHT_DOWN && !this.RIGHT_UP && this.pos_right < PADDLE_DOWN)
          { new_right = 0.2; this.pos_right += 0.2; }

        this.model_stick_right = this.model_stick_right.times(Mat4.translation([0,0, new_right]));
        this.shapes.stick_right.draw(graphics_state, this.model_stick_right, this.materials.stick_right);

        // 7) Reenabling Transparency
        this.con.gl.depthMask(true);
        this.con.gl.disable(gl.BLEND);

        // 8) Resetting Game Mechanics
        if(this.scored) 
        {
          if(this.scored != 40) { 
            if(this.left_score == this.MAX_SCORE) 
              this.scored_html.innerText = "P1 Wins!";
            else if(this.right_score == this.MAX_SCORE) 
              this.scored_html.innerText = "P2 Wins!";
            else 
              this.scored_html.innerText = "Scored!";
            
            this.scored += 1;
            this.model_puck = this.reset_puck;
            this.model_stick_left = this.reset_left;
            this.model_stick_right = this.reset_right;
            this.reflect_puck = this.reset_reflect;
            this.LEFT_UP = false;this.LEFT_DOWN = false;
            this.RIGHT_UP = false; this.RIGHT_DOWN = false;
          }
          else 
          { 
            this.COL_LEFT = false; this.COL_RIGHT = false;
            if(this.right_score == this.MAX_SCORE || this.left_score == this.MAX_SCORE) {
              this.RESET_GAME = true; this.paused = true;
            }
            else {
              this.scored_html.innerText = ""; this.scored = 0;
              this.start_round(graphics_state);
            }
          }
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
      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return `
        attribute vec3 object_space_pos;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_transform;

        void main()
        {
          gl_Position = projection_camera_transform*model_transform*vec4(object_space_pos, 1.0);
          position = vec4(object_space_pos, 1.0);
          center = vec4(0., 0., 0., 1.0);
        }`;           // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    { return `
        void main()
        {
         float dist = distance(position, center);
         vec4 color = vec4(0.5,0.0,0.0,0.7);
         gl_FragColor = color*smoothstep(-1., 1., sin(dist*50.));

        }`;           // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
    }
}

window.Grid_Sphere = window.classes.Grid_Sphere =
class Grid_Sphere extends Shape           // With lattitude / longitude divisions; this means singularities are at
  { constructor( rows, columns, texture_range )             // the mesh's top and bottom.  Subdivision_Sphere is a better alternative.
      { super( "positions", "normals", "texture_coords" );
        const circle_points = Array( rows ).fill( Vec.of( .75,0,0 ) )
                                           .map( (p,i,a) => Mat4.translation([ -2,0,0 ])
                                                    .times( Mat4.rotation( i/(a.length-1) * 2*Math.PI, Vec.of( 0,-1,0 ) ) )
                                                    .times( p.to4(1) ).to3() );

        Surface_Of_Revolution.insert_transformed_copy_into( this, [ rows, columns, circle_points ] );

                      // TODO:  Complete the specification of a sphere with lattitude and longitude lines
                      //        (Extra Credit Part III)
      } }

class SkyboxCube extends Cube {
  constructor() {
    super("positions", "normals", "texture_coords");
    let new_texture_coords = [];
    for (let i = 0; i < 6; i++) {
      new_texture_coords.push([0, 0]);
      new_texture_coords.push([1, 0]);
      new_texture_coords.push([0, 1]);
      new_texture_coords.push([1, 1]);
    }
    this.texture_coords = new_texture_coords;
  }
}

class ReflectPuck_Shader extends Phong_Shader {
  update_GPU(g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl ) {
    super.update_GPU(g_state, model_transform, material, gpu, gl);
    gl.uniform1f(gpu.zdist_loc, g_state.z_dist);
    gl.uniform1f(gpu.paddle_zscale_loc, 2.5);
  }
  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
        const int N_LIGHTS = 2;             // We're limited to only so many inputs in hardware.  Lights are costly (lots of sub-values).
        uniform float ambient, diffusivity, specularity, smoothness, animation_time, attenuation_factor[N_LIGHTS];
        uniform bool GOURAUD, COLOR_NORMALS, USE_TEXTURE;               // Flags for alternate shading methods
        uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS], shapeColor;
        varying vec3 N, E;                    // Specifier "varying" means a variable's final value will be passed from the vertex shader
        varying vec2 f_tex_coord;             // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        varying vec4 VERTEX_COLOR;            // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 L[N_LIGHTS], H[N_LIGHTS];
        varying float dist[N_LIGHTS];
        varying vec3 object_pos;
        uniform float zdist;
        uniform float paddle_zscale;

        vec3 phong_model_lights( vec3 N )
          { vec3 result = vec3(0.0);
            for(int i = 0; i < N_LIGHTS; i++)
              {
                float attenuation_multiplier = 1.0 / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
                float diffuse  =      max( dot(N, L[i]), 0.0 );
                float specular = pow( max( dot(N, H[i]), 0.0 ), smoothness );

                result += attenuation_multiplier * ( shapeColor.xyz * diffusivity * diffuse + lightColor[i].xyz * specularity * specular );
              }
            return result;
          }
        `;
    }
    vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return `
        attribute vec3 object_space_pos, normal;
        attribute vec2 tex_coord;

        uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
        uniform mat3 inverse_transpose_modelview;

        void main()
        { gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);     // The vertex's final resting place (in NDCS).
          N = normalize( inverse_transpose_modelview * normal );                             // The final normal vector in screen space.
          f_tex_coord = tex_coord;                                        // Directly use original texture coords and interpolate between.
          object_pos = object_space_pos;

          if( COLOR_NORMALS )                                     // Bypass all lighting code if we're lighting up vertices some other way.
          { VERTEX_COLOR = vec4( N[0] > 0.0 ? N[0] : sin( animation_time * 3.0   ) * -N[0],             // In "normals" mode,
                                 N[1] > 0.0 ? N[1] : sin( animation_time * 15.0  ) * -N[1],             // rgb color = xyz quantity.
                                 N[2] > 0.0 ? N[2] : sin( animation_time * 45.0  ) * -N[2] , 1.0 );     // Flash if it's negative.
            return;
          }
                                                  // The rest of this shader calculates some quantities that the Fragment shader will need:
          vec3 screen_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
          E = normalize( -screen_space_pos );

          for( int i = 0; i < N_LIGHTS; i++ )
          {            // Light positions use homogeneous coords.  Use w = 0 for a directional light source -- a vector instead of a point.
            L[i] = normalize( ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * screen_space_pos );
            H[i] = normalize( L[i] + E );

            // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
            dist[i]  = lightPosition[i].w > 0.0 ? distance((camera_transform * lightPosition[i]).xyz, screen_space_pos)
                                                : distance( attenuation_factor[i] * -lightPosition[i].xyz, object_space_pos.xyz );
          }

          if( GOURAUD )                   // Gouraud shading mode?  If so, finalize the whole color calculation here in the vertex shader,
          {                               // one per vertex, before we even break it down to pixels in the fragment shader.   As opposed
                                          // to Smooth "Phong" Shading, where we *do* wait to calculate final color until the next shader.
            VERTEX_COLOR      = vec4( shapeColor.xyz * ambient, shapeColor.w);
            VERTEX_COLOR.xyz += phong_model_lights( N );
          }
        }`;
    }
  fragment_glsl_code()
    {
      return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          vec4 tex_color = texture2D( texture, f_tex_coord );                         // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w );
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );
          if (zdist > (paddle_zscale - 0.5)) {
            float frac = min(1.0, max(-1.0, -2.0 * (zdist - paddle_zscale)));
            if (object_pos.x > frac) {
              discard;
            }
          } else if (zdist < (-paddle_zscale + 0.5)) {
            float frac = max(-1.0, min(1.0, -2.0 * (zdist + paddle_zscale)));
            if (object_pos.x < frac) {
              discard;
            }
          }
        }`;
    }
}

const SCORE_COLOR = Color.of(0.38, 0.357, 0.51, 1);
const generateNumberShapes = (context) => ({
  num0: context.get_instance(Phong_Shader).material(SCORE_COLOR, {
    ambient: 0.7,
    diffusivity: 0,
    specularity: 0,
    texture: context.get_instance("assets/0.png", false)
  }),
  num1: context.get_instance(Phong_Shader).material(SCORE_COLOR, {
    ambient: 0.7,
    diffusivity: 0,
    specularity: 0,
    texture: context.get_instance("assets/1.png", false)
  }),
  num2: context.get_instance(Phong_Shader).material(SCORE_COLOR, {
    ambient: 0.7,
    diffusivity: 0,
    specularity: 0,
    texture: context.get_instance("assets/2.png", false)
  }),
  num3: context.get_instance(Phong_Shader).material(SCORE_COLOR, {
    ambient: 0.7,
    diffusivity: 0,
    specularity: 0,
    texture: context.get_instance("assets/3.png", false)
  }),
  num4: context.get_instance(Phong_Shader).material(SCORE_COLOR, {
    ambient: 0.7,
    diffusivity: 0,
    specularity: 0,
    texture: context.get_instance("assets/4.png", false)
  }),
  num5: context.get_instance(Phong_Shader).material(SCORE_COLOR, {
    ambient: 0.7,
    diffusivity: 0,
    specularity: 0,
    texture: context.get_instance("assets/5.png", false)
  }),
  num6: context.get_instance(Phong_Shader).material(SCORE_COLOR, {
    ambient: 0.7,
    diffusivity: 0,
    specularity: 0,
    texture: context.get_instance("assets/6.png", false)
  }),
  num7: context.get_instance(Phong_Shader).material(SCORE_COLOR, {
    ambient: 0.7,
    diffusivity: 0,
    specularity: 0,
    texture: context.get_instance("assets/7.png", false)
  }),
  num8: context.get_instance(Phong_Shader).material(SCORE_COLOR, {
    ambient: 0.7,
    diffusivity: 0,
    specularity: 0,
    texture: context.get_instance("assets/8.png", false)
  }),
  num9: context.get_instance(Phong_Shader).material(SCORE_COLOR, {
    ambient: 0.7,
    diffusivity: 0,
    specularity: 0,
    texture: context.get_instance("assets/9.png", false)
  })
});

const drawScore = (graphics_state, model_transform, number_shape, materials, score, maxscore) => {
  if (score > 99 || score < 0)
    return;

  const scoreStr = score.toString();
  if (scoreStr.length == 1) {
    const material = materials[`num${scoreStr[0]}`];
    if(score <= maxscore) 
      number_shape.draw(graphics_state, model_transform, material);
  } else if (scoreStr.length == 2) {
    const matFirst = materials[`num${scoreStr[0]}`];
    const matSec = materials[`num${scoreStr[1]}`];
    const modelFirst = model_transform.times(Mat4.translation([-0.9, 0, 0]));
    const modelSecond = model_transform.times(Mat4.translation([0.9, 0, 0]));
    if(score <= maxscore) {
      number_shape.draw(graphics_state, modelFirst, matFirst);
      number_shape.draw(graphics_state, modelSecond, matSec);
    }
  }
  
}

