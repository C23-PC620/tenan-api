const axios = require('axios');
const {knex} = require('../configs/data-source.js');


const getAllTourisms = async (req, res) => {
  const query = req.query.q;
  const city = req.query.city;
  const page = req.query.page;

  // Set the default value of page to 1 if it is not provided or invalid
  const pageNumber = (page && /^\d+$/.test(page)) ? parseInt(page) : 1;

  let total;
  const size = 10;
  let tourisms;
  let totalPage;

  // Mengecek apakah ada query q , city, dan page.
  if (!query && !city) {
    try {
      // mengecheck total row di table
      const totalQuery = await knex('tourisms').count('* as total');
      total = totalQuery[0].total;
      totalPage = Math.ceil(total / size);

      // kembaliin semuanya tapi pake limit sesuai kesepakatan front-end
      tourisms = await knex('tourisms')
          .select('tourisms.id_wisata as tourism_id',
              'tourisms.nama_tempat as place_name',
              'tourisms.rating',
              'cities.nama_daerah as city',
              'tourisms.category',
              'tourimages.url_image as image_url')
          .leftJoin('cities', 'tourisms.id_daerah', 'cities.id_daerah')
          .leftJoin('tourimages', 'tourisms.id_wisata', 'tourimages.id_wisata')
          .orderBy('tourisms.nama_tempat', 'desc').limit(size)
          .offset((pageNumber - 1) * size);
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        code: '500',
        status: 'Internal Server Error',
        errors: {
          message: 'An error occurred while fetching all tourisms',
        },
      });
    }
  } else if (!query && city) {
    try {
      // mengecheck total row di table
      const totalQuery = await knex('tourisms')
          .leftJoin('cities', 'tourisms.id_daerah', 'cities.id_daerah')
          .where('cities.nama_daerah', city)
          .count('* as total');
      total = totalQuery[0].total;
      totalPage = Math.ceil(total / size);

      tourisms = await knex('tourisms')
          .select('tourisms.id_wisata as tourism_id',
              'tourisms.nama_tempat as place_name',
              'tourisms.rating',
              'cities.nama_daerah as city',
              'tourisms.category',
              'tourimages.url_image as image_url')
          .leftJoin('cities', 'tourisms.id_daerah', 'cities.id_daerah')
          .leftJoin('tourimages', 'tourisms.id_wisata', 'tourimages.id_wisata')
          .where('cities.nama_daerah', city)
          .orderBy('nama_tempat', 'desc')
          .limit(size)
          .offset((pageNumber - 1) * size);
      if (tourisms.length == 0 && totalPage == 0) {
        return res.status(404).send({
          code: '404',
          status: 'Not Found',
          errors: {
            message: 'City not found in the database',
          },
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        code: '500',
        status: 'Internal Server Error',
        errors: {
          message: 'An error occurred while fetching tourism',
        },
      });
    }
  } else if (query && !city) {
    try {
      // mengecheck total row di table
      const totalQuery = await knex('tourisms')
          .where('tourisms.nama_tempat', 'LIKE', `%${query}%`)
          .count('* as total');
      total = totalQuery[0].total;
      totalPage = Math.ceil(total / size);

      tourisms = await knex('tourisms')
          .select('tourisms.id_wisata as tourism_id',
              'tourisms.nama_tempat as place_name',
              'tourisms.rating',
              'cities.nama_daerah as city',
              'tourisms.category',
              'tourimages.url_image as image_url')
          .leftJoin('cities', 'tourisms.id_daerah', 'cities.id_daerah')
          .leftJoin('tourimages', 'tourisms.id_wisata', 'tourimages.id_wisata')
          .where('tourisms.nama_tempat', 'LIKE', `%${query}%`)
          .orderBy('nama_tempat', 'desc')
          .limit(size)
          .offset((pageNumber - 1) * size);
      if (tourisms.length == 0 && totalPage == 0) {
        return res.status(404).send({
          code: '404',
          status: 'Not Found',
          errors: {
            message: 'Places not found in the database',
          },
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        code: '500',
        status: 'Internal Server Error',
        errors: {
          message: 'An error occurred while fetching tourism',
        },
      });
    }
  }

  if (pageNumber > totalPage) {
    return res.status(404).send({
      code: '404',
      status: 'Not Found',
      errors: {
        message: 'The requested page does not exist',
      },
    });
  } else {
    return res.status(200).send({
      code: '200',
      status: 'OK',
      current_page: pageNumber,
      total_page: totalPage,
      total: total,
      size: tourisms.length,
      data: tourisms,
    });
  }
};

const getTourismsDetail = async (req, res) => {
  try {
    const tourismsId = req.params.tourismsId;
    const tourism = await knex('tourisms')
        .select('tourisms.id_wisata as tourism_id',
            'tourisms.nama_tempat as place_name',
            'tourisms.rating',
            'tourisms.category',
            'tourisms.description',
            'tourisms.alamat as address',
            'cities.nama_daerah as city',
            'tourimages.url_image as image_url')
        .leftJoin('cities', 'tourisms.id_daerah', 'cities.id_daerah')
        .leftJoin('tourimages', 'tourisms.id_wisata', 'tourimages.id_wisata')
        .where('tourisms.id_wisata', tourismsId)
        .first();

    if (!tourism) {
      return res.status(404).send({
        code: '404',
        status: 'Not Found',
        errors: {
          message: 'Tourism not found',
        },
      });
    } else {
      return res.status(200).send({
        code: '200',
        status: 'OK',
        data: tourism,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      code: '500',
      status: 'Internal Server Error',
      errors: {
        message: 'An error occurred while fetching tourism',
      },
    });
  }
};

const getCity = async (req, res) => {
  try {
    const cities = await knex('cities').select('nama_daerah as city');
    return res.status(200).send({
      code: '200',
      status: 'OK',
      data: cities,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      code: '500',
      status: 'Internal Server Error',
      errors: {
        message: 'An error occurred while fetching cities',
      },
    });
  }
};

const getPredictedHotel = async (req, res) => {
  axios.post(process.env.URL_MACHINELEARNING, {
    longtitude: 106.809331,
    latitude: -6.216947,
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    console.log(response.data);
  }), (error) => {
  };
};

module.exports = {
  getAllTourisms,
  getTourismsDetail,
  getPredictedHotel,
  getCity,
};
