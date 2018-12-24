import React, { Component } from "react";
import { FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import config from "../config";
import "./NewNote.css";
import { API } from "aws-amplify";
import { s3Upload } from "../libs/awsLib";

export default class NewNote extends Component {
  constructor(props) {
    super(props);

    this.file = null;

    this.state = {
      isClassifying: null,
      isUploading: null,
      content: ""
    };
  }

  validateForm() {
    return this.state.content.length > 0;
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  }

  handleFileChange = event => {
    this.file = event.target.files[0];
  }

  handleSubmit = async event => {
    event.preventDefault();
  
    if (this.file && this.file.size > config.MAX_ATTACHMENT_SIZE) {
      alert(`Please pick a file smaller than ${config.MAX_ATTACHMENT_SIZE/1000000} MB.`);
      return;
    }
  
    this.setState({ isUploading: true });
  
    try {
      const attachment = this.file
        ? await s3Upload(this.file)
        : null;
  
      const newNote = await this.createNote({
        attachment,
        content: this.state.content
      });

      this.setState({
        isUploading: false,
        isClassifying: true
      });

      await this.classifyNote(newNote.noteId);
      
      this.props.history.push(`/notes/${newNote.noteId}`);
    } catch (e) {
      alert(e);
      this.setState({
        isUploading: false,
        isClassifying: false
      });
    }
  }
  
  createNote(note) {
    return API.post("notes", "/notes", {
      body: note
    });
  }

  classifyNote(noteId) {
    return API.get("notes", `/classify/${noteId}`);
  }

  render() {
    return (
      <div className="NewNote">
        <form onSubmit={this.handleSubmit}>
          <FormGroup controlId="file">
            <ControlLabel>Selfie</ControlLabel>
            <FormControl onChange={this.handleFileChange} type="file" />
          </FormGroup>
          <FormGroup controlId="content">
            <FormControl
              onChange={this.handleChange}
              value={this.state.content}
              type="text"
            />
          </FormGroup>
          <LoaderButton
            block
            bsStyle="primary"
            bsSize="large"
            disabled={!this.validateForm()}
            type="submit"
            isLoading={this.state.isUploading}
            text="Create"
            loadingText="Creating…"
          />
          <LoaderButton
            block
            bsStyle="info"
            bsSize="large"
            disabled={true}
            type="submit"
            isLoading={this.state.isClassifying}
            text="Waiting for image..."
            loadingText="Classifying…"
          />
        </form>
      </div>
    );
  }
}