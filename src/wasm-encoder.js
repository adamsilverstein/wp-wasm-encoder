/**
 * WordPress Dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Button, PanelBody } from '@wordpress/components';

/**
 * Add mobile visibility controls on Advanced Block Panel.
 *
 * @param {Function} BlockEdit Block edit component.
 *
 * @return {Function} BlockEdit Modified block edit component.
 */
export const wasmVideoEncoderTab = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			const { name, attributes, setAttributes, isSelected } = props;

			let ffmpeg = null;

			const transcode = ( { target } ) => {
				if ( ffmpeg === null ) {
					ffmpeg = createFFmpeg( {
						log: true,
						corePath:
							'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js',
					} );
				}
				const message = document.getElementById( 'message' );
				const video = document.getElementById( 'output-video' );

				message.innerHTML = 'Loading ffmpeg-core.js';

				ffmpeg
					.load()
					.then( () => {
						return ffmpeg.FS(
							'writeFile',
							'video.mp4',
							fetchFile( target )
						);
					} )
					.then( () => {
						message.innerHTML = 'Start transcoding';
						return ffmpeg.run( '-i', name, 'output.mp4' );
					} )
					.then( () => {
						message.innerHTML = 'Complete transcoding';
						const data = ffmpeg.FS( 'readFile', 'output.mp4' );
						video.src = URL.createObjectURL(
							new Blob( [ data.buffer ], { type: 'video/mp4' } )
						);
					} );
			};

			const cancel = () => {
				try {
					ffmpeg.exit();
				} catch ( e ) {
					throw new Error( e );
				}
				ffmpeg = null;
			};

			return (
				<Fragment>
					<BlockEdit { ...props } />
					<InspectorControls>
						<PanelBody
							initialOpen={ true }
							icon="visibility"
							title={ __( 'Wasm-encoder' ) }
						>
							{ isSelected && name === 'core/video' && (
								<>
									<h3>to mp4 (x264)</h3>
									<video
										id="output-video"
										src={ attributes.src }
										controls
									></video>
									<br />
									<Button
										variant={ 'primary' }
										onClick={ () =>
											transcode( {
												target: attributes.src,
											} )
										}
									>
										Encode
									</Button>
									<Button onClick={ cancel }>Cancel</Button>
									<p id="message"></p>
								</>
							) }
							{ isSelected && name === 'core/image' && (
								<>
									<p>Imagemagick</p>
								</>
							) }
						</PanelBody>
					</InspectorControls>
					<script>
						{ ' ' }
						if (!crossOriginIsolated) SharedArrayBuffer =
						ArrayBuffer;{ ' ' }
					</script>
				</Fragment>
			);
		};
	},
	'withAdvancedControls'
);

addFilter( 'editor.BlockEdit', 'codekraft/wasm-encoder', wasmVideoEncoderTab );
