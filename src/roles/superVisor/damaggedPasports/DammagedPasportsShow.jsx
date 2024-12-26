import React, { useState, useEffect } from "react";
import {
  Spin,
  message,
  Modal,
  Form,
  Input,
  Button,
  ConfigProvider,
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import "./dammagedPasportsShow.css";
import useAuthStore from "./../../../store/store";
import Url from "./../../../store/url.js";
import Lele from "./../../../reusable elements/icons.jsx";

const DammagedPasportsShow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const passportId = location.state?.id;
  const [passportData, setPassportData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { isSidebarCollapsed, accessToken, profile } = useAuthStore();
  const { profileId, governorateId, officeId } = profile || {};

  useEffect(() => {
    if (!passportId) {
      message.error("معرف الجواز غير موجود.");
      navigate(-1);
      return;
    }

    const fetchPassportDetails = async () => {
      setLoading(true);
      try {
        console.log("Fetching Passport Details for ID:", passportId);
        const response = await axios.get(
          `${Url}/api/DamagedPassport/${passportId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const passport = response.data;
        const formattedDate = passport.date
          ? new Date(passport.date).toISOString().slice(0, 19) + "Z"
          : "";
        setPassportData({ ...passport, date: formattedDate });
        form.setFieldsValue({ ...passport, date: formattedDate });
      } catch (error) {
        console.error("Error Fetching Passport Details:", error.response);
        message.error(
          `حدث خطأ أثناء جلب تفاصيل الجواز: ${
            error.response?.data?.message || error.message
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchPassportImages = async () => {
      try {
        const response = await axios.get(
          `${Url}/api/Attachment/DamagedPassport/${passportId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const imageUrls = response.data.map((image) => image.filePath);
        setImages(imageUrls);
      } catch (error) {
        console.error("Error Fetching Passport Images:", error.response);
        message.error(
          `حدث خطأ أثناء جلب صور الجواز: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    };

    fetchPassportDetails();
    fetchPassportImages();
  }, [passportId, accessToken, navigate, form]);

  const handleSaveEdit = async (values) => {
    try {
      const updatedValues = {
        id: passportId, // Ensure ID is consistent
        passportNumber: values.passportNumber,
        date: values.date
          ? new Date(values.date).toISOString().slice(0, 19) + "Z"
          : passportData.date,
        note: values.notes,
        damagedTypeId: passportData.damagedTypeId,
        governorateId: governorateId,
        officeId: officeId,
        profileId: profileId,
      };

      console.log("Sending Updated Values:", updatedValues);

      const response = await axios.put(
        `${Url}/api/DamagedPassport/${passportId}`, // Ensure the path matches the backend API
        updatedValues,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Update Response:", response.data);

      message.success("تم تحديث بيانات الجواز بنجاح");
      setEditModalVisible(false);
      setPassportData((prev) => ({ ...prev, ...updatedValues }));
    } catch (error) {
      console.error("Error Updating Passport Details:", error.response);
      message.error(
        `حدث خطأ أثناء تعديل بيانات الجواز: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${Url}/api/DamagedPassport/${passportId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      message.success("تم حذف الجواز بنجاح");
      setDeleteModalVisible(false);
      navigate(-1);
    } catch (error) {
      console.error("Error Deleting Passport:", error.response);
      message.error(
        `حدث خطأ أثناء حذف الجواز: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!passportData) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div
      className={`supervisor-passport-damage-show-container ${
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-passport-damage-show-container"
      }`}
      dir="rtl">
      <div className="title-container">
        <h1>تفاصيل الجواز التالف</h1>
        <div className="edit-button-and-delete">
          <Button onClick={handleBack} className="back-button">
            <Lele type="back" />
            الرجوع
          </Button>
          <Button
            onClick={() => setDeleteModalVisible(true)}
            className="delete-button-passport">
            حذف <Lele type="delete" />
          </Button>
          <Button
            onClick={() => setEditModalVisible(true)}
            className="edit-button-passport">
            تعديل <Lele type="edit" />
          </Button>
        </div>
      </div>

      <div className="details-container">
        <div className="details-fields">
          <div className="details-row">
            <span className="details-label">رقم الجواز:</span>
            <Input
              className="details-value"
              value={passportData.passportNumber}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">التاريخ:</span>
            <Input
              className="details-value"
              value={new Date(passportData.date).toLocaleDateString("ar-EG")}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">سبب التلف:</span>
            <Input
              className="details-value"
              value={passportData.damagedTypeName || "غير محدد"}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">الملاحظات:</span>
            <Input.TextArea
              className="textarea-value"
              value={passportData.notes || "لا توجد ملاحظات"}
              disabled
            />
          </div>
        </div>
        <div className="image-container">
          {images.length > 0 && (
            <div className="image-preview-container">
              <span className="note-details-label">صور الجواز:</span>
              <ImagePreviewer
                uploadedImages={images}
                defaultWidth={1000}
                defaultHeight={600}
              />
            </div>
          )}
        </div>
      </div>

      <ConfigProvider direction="rtl">
        <Modal
          className="model-container"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}>
          <h1>تعديل بيانات الجواز</h1>
          <Form
            form={form}
            onFinish={handleSaveEdit}
            layout="vertical"
            className="Admin-user-add-model-container-form">
            <Form.Item
              name="passportNumber"
              label="رقم الجواز"
              rules={[{ required: true, message: "يرجى إدخال رقم الجواز" }]}>
              <Input placeholder="رقم الجواز" />
            </Form.Item>
            <Form.Item
              name="date"
              label="التاريخ"
              rules={[{ required: true, message: "يرجى إدخال التاريخ" }]}>
              <Input placeholder="التاريخ" type="datetime-local" />
            </Form.Item>
            <Form.Item
              name="notes"
              label="الملاحظات"
              rules={[{ required: false }]}>
              <Input.TextArea placeholder="أدخل الملاحظات" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>
              حفظ التعديلات
            </Button>
          </Form>
        </Modal>

        <Modal
          title="تأكيد الحذف"
          open={deleteModalVisible}
          onOk={handleDelete}
          onCancel={() => setDeleteModalVisible(false)}
          okText="حذف"
          cancelText="إلغاء">
          <p>هل أنت متأكد أنك تريد حذف هذا الجواز؟</p>
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default DammagedPasportsShow;
