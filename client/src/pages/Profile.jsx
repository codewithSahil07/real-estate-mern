import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { app } from "../firebase.js";
import {
  deleteFail,
  deleteStart,
  deleteSuccess,
  signoutFail,
  signoutStart,
  signoutSuccess,
  updateFail,
  updateStart,
  updateSuccess,
} from "../store/user/slice.js";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

export default function Profile() {
  const { currentUser } = useSelector((state) => state.user);
  const [file, setFile] = useState(undefined);
  const [filePerc, setFilePerc] = useState(0);
  const [formData, setFormData] = useState({});
  const [fileUploadError, setFileUploadError] = useState(null);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const { error, loading } = useSelector((state) => state.user);
  // console.log(file);
  // console.log(filePerc);
  // console.log(formData);
  // console.log(error);

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
  }, [file]);

  const inputHandler = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFileUpload = (file) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const process = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilePerc(Math.round(process));
      },
      (error) => {
        setFileUploadError(true);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFormData({ ...formData, avatar: downloadURL });
        });
      }
    );
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      console.log(data);
      if (data.success === false) {
        dispatch(updateFail(data.message));
        return;
      }
      dispatch(updateSuccess(data));
      setUpdateSuccessMsg("User Data Updated Successfully!");
    } catch (error) {
      dispatch(updateFail(error));
    }
  };

  const deleteHandler = async () => {
    try {
      dispatch(deleteStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteFail(data.message));
        return;
      }
      // console.log("User Deleted Successfully");
      dispatch(deleteSuccess());
    } catch (error) {
      dispatch(deleteFail(error));      
    }
  };

  const signoutHandler = async () => {
    try {
      dispatch(signoutStart());
      const res = await fetch('/api/auth/signout');
      const data = await res.json();
      if(data.success == false) {
        dispatch(signoutFail(data.message));
        return;
      }
      dispatch(signoutSuccess());
    } catch (error) {
      dispatch(signoutFail(error));
    }
  };

  return (
    <div className="my-5 max-w-lg m-auto">
      <div className="font-semibold text-center text-3xl">Profile</div>
      <form onSubmit={submitHandler} className="flex flex-col p-5">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          ref={fileRef}
          hidden
          accept="image/*"
        />
        <img
          className="w-20 h-20 object-cover cursor-pointer self-center rounded-full"
          onClick={() => fileRef.current.click()}
          src={formData.avatar || currentUser.avatar}
          alt="Profile-Pic"
        />
        <p className="text-sm self-center">
          {fileUploadError ? (
            <span className="text-red-800">Error Image Upload</span>
          ) : filePerc > 0 && filePerc < 100 ? (
            <span>{`uploading ${filePerc}%`}</span>
          ) : filePerc == 100 ? (
            <span className="text-green-800">Image Successfully Uploaded</span>
          ) : (
            ""
          )}
        </p>
        <input
          onChange={inputHandler}
          defaultValue={currentUser.username}
          placeholder="username"
          type="text"
          id="username"
          className="my-2 p-3 border rounded-lg"
        />
        <input
          onChange={inputHandler}
          defaultValue={currentUser.email}
          placeholder="email"
          type="text"
          id="email"
          className="my-2 p-3 border rounded-lg"
        />
        <input
          onChange={inputHandler}
          defaultValue={currentUser.password}
          placeholder="password"
          type="password"
          id="password"
          className="my-2 p-3 border rounded-lg"
        />
        <button
          disabled={loading}
          className="my-2 p-2 rounded-lg bg-slate-600 text-white uppercase hover:opacity-90 disabled:opacity-70"
        >
          {loading ? "loading..." : "update"}
        </button>
        {/* <button className="my-2 p-2 rounded-lg bg-slate-600 text-white uppercase hover:opacity-90 disabled:opacity-70">
          Create Shifting
        </button> */}
        <div className="flex justify-between">
          <span onClick={deleteHandler} className="cursor-pointer text-red-600">
            Delete Account
          </span>
          <span
            className="cursor-pointer text-red-600"
            onClick={signoutHandler}
          >
            Sign Out
          </span>
        </div>
      </form>
      {error && <p className="text-center text-red-500">{error}</p>}
      {updateSuccessMsg && (
        <p className="text-center text-green-800">{updateSuccessMsg}</p>
      )}
    </div>
  );
}
